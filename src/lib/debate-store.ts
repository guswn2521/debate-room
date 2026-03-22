import {
  agendaAdvancedPrompt,
  buildAgenda,
  buildFinalReport,
  buildSegmentSummary,
  codeFromTopic,
  idlePrompt,
  moderatorIntro,
  penaltyState,
  speakerPrompt,
} from "@/lib/debate-engine";
import {
  type ActiveSpeechSession,
  type DebateRoom,
  type PenaltyEvent,
  type PenaltyEventType,
  type Participant,
  type RaiseRequest,
  type RoomSnapshot,
  type Utterance,
} from "@/lib/debate-types";

type CreateRoomInput = {
  topic: string;
  participantCount: number;
  hostName: string;
};

type EndSpeechInput = {
  participantId: string;
  transcript: string;
  startedAt: string;
  endedAt: string;
  peakVolume: number;
  source: Utterance["source"];
};

type DebateStore = {
  rooms: Map<string, DebateRoom>;
};

declare global {
  var __debateStore: DebateStore | undefined;
}

function getStore(): DebateStore {
  if (!globalThis.__debateStore) {
    globalThis.__debateStore = {
      rooms: new Map<string, DebateRoom>(),
    };
  }

  return globalThis.__debateStore;
}

function now() {
  return new Date().toISOString();
}

function touch(room: DebateRoom) {
  room.updatedAt = now();
  room.version += 1;
}

function getRoomOrThrow(code: string) {
  const room = getStore().rooms.get(code.toUpperCase());

  if (!room) {
    throw new Error("ROOM_NOT_FOUND");
  }

  return room;
}

function getParticipant(room: DebateRoom, participantId: string) {
  const participant = room.participants.find(
    (entry) => entry.id === participantId,
  );

  if (!participant) {
    throw new Error("PARTICIPANT_NOT_FOUND");
  }

  return participant;
}

function agendaId(room: DebateRoom) {
  return room.agenda[room.currentAgendaIndex]?.id ?? room.agenda[0].id;
}

function applyPenalty(
  room: DebateRoom,
  participantId: string,
  type: PenaltyEventType,
  points: number,
  reason: string,
) {
  const participant = getParticipant(room, participantId);

  participant.score += points;
  participant.penaltyState = penaltyState(participant.score);

  const event: PenaltyEvent = {
    id: crypto.randomUUID(),
    participantId,
    participantName: participant.name,
    type,
    points,
    reason,
    createdAt: now(),
  };

  room.penaltyEvents.push(event);
  touch(room);

  return event;
}

function assignSpeaker(room: DebateRoom, participantId: string) {
  const participant = getParticipant(room, participantId);
  room.turn = {
    speakerId: participantId,
    startedAt: now(),
    status: "speaking",
    round: room.turn.round + 1,
  };
  room.moderatorMessage = speakerPrompt(room, participant.name);

  if (participant.score >= 4) {
    participant.pendingBgmCue = crypto.randomUUID();
  }

  touch(room);
}

function clearRaiseQueue(room: DebateRoom) {
  room.raiseQueue = [];
  touch(room);
}

function completeAgenda(room: DebateRoom) {
  room.agenda = room.agenda.map((item, index) => {
    if (index < room.currentAgendaIndex) {
      return { ...item, status: "complete" };
    }

    if (index === room.currentAgendaIndex) {
      return { ...item, status: "active" };
    }

    return { ...item, status: "upcoming" };
  });
}

function latestPenaltyFor(room: DebateRoom, participantId: string) {
  return [...room.penaltyEvents]
    .reverse()
    .find((event) => event.participantId === participantId) ?? null;
}

function serialize(room: DebateRoom, participantId: string): RoomSnapshot {
  const participant = getParticipant(room, participantId);
  const queuePosition = room.raiseQueue.findIndex(
    (request) => request.participantId === participantId,
  );

  return {
    room,
    viewer: {
      participantId,
      participantName: participant.name,
      isHost: participant.isHost,
      isCurrentSpeaker: room.turn.speakerId === participantId,
      canRaise: room.status === "active" && room.turn.speakerId !== participantId,
      canEndTurn:
        room.status === "active" &&
        (room.turn.speakerId === participantId || participant.isHost),
      canAdvanceAgenda: room.status === "active" && participant.isHost,
      canEndDebate: room.status === "active" && participant.isHost,
      queuePosition: queuePosition >= 0 ? queuePosition + 1 : null,
      score: participant.score,
      penaltyState: participant.penaltyState,
      pendingBgmCue: participant.pendingBgmCue,
      latestPenalty: latestPenaltyFor(room, participantId),
    },
  };
}

export function createRoom(input: CreateRoomInput) {
  const store = getStore();
  let code = codeFromTopic();

  while (store.rooms.has(code)) {
    code = codeFromTopic();
  }

  const hostId = crypto.randomUUID();
  const room: DebateRoom = {
    code,
    topic: input.topic.trim(),
    participantsExpected: input.participantCount,
    hostId,
    status: "active",
    createdAt: now(),
    updatedAt: now(),
    version: 1,
    moderatorMessage: moderatorIntro(input.topic.trim(), input.participantCount),
    agenda: buildAgenda(input.topic.trim()),
    currentAgendaIndex: 0,
    participants: [
      {
        id: hostId,
        name: input.hostName.trim(),
        joinedAt: now(),
        score: 0,
        penaltyState: "clear",
        isHost: true,
        pendingBgmCue: null,
      },
    ],
    turn: {
      speakerId: null,
      startedAt: null,
      status: "idle",
      round: 0,
    },
    raiseQueue: [],
    utterances: [],
    penaltyEvents: [],
    summaries: [],
    finalReport: null,
    activeSpeech: [],
  };

  completeAgenda(room);
  store.rooms.set(code, room);

  return {
    code,
    participantId: hostId,
  };
}

export function joinRoom(code: string, name: string) {
  const room = getRoomOrThrow(code);
  const trimmedName = name.trim();
  const existing = room.participants.find(
    (participant) => participant.name.toLowerCase() === trimmedName.toLowerCase(),
  );

  if (existing) {
    return {
      code: room.code,
      participantId: existing.id,
    };
  }

  const participant: Participant = {
    id: crypto.randomUUID(),
    name: trimmedName,
    joinedAt: now(),
    score: 0,
    penaltyState: "clear",
    isHost: false,
    pendingBgmCue: null,
  };

  room.participants.push(participant);
  touch(room);

  return {
    code: room.code,
    participantId: participant.id,
  };
}

export function getRoomSnapshot(code: string, participantId: string) {
  return serialize(getRoomOrThrow(code), participantId);
}

export function requestRaise(code: string, participantId: string) {
  const room = getRoomOrThrow(code);
  const participant = getParticipant(room, participantId);

  if (room.status !== "active") {
    throw new Error("ROOM_ENDED");
  }

  if (room.turn.speakerId === participantId) {
    return serialize(room, participantId);
  }

  const alreadyQueued = room.raiseQueue.some(
    (request) => request.participantId === participantId,
  );

  if (alreadyQueued) {
    return serialize(room, participantId);
  }

  const request: RaiseRequest = {
    participantId,
    participantName: participant.name,
    requestedAt: now(),
  };

  if (!room.turn.speakerId) {
    assignSpeaker(room, participantId);
  } else {
    room.raiseQueue.push(request);
    touch(room);
  }

  return serialize(room, participantId);
}

export function endTurn(code: string, participantId: string) {
  const room = getRoomOrThrow(code);
  const participant = getParticipant(room, participantId);

  if (
    room.turn.speakerId !== participantId &&
    !participant.isHost
  ) {
    throw new Error("FORBIDDEN");
  }

  room.turn = {
    speakerId: null,
    startedAt: null,
    status: "idle",
    round: room.turn.round,
  };

  room.activeSpeech = [];

  const summary = buildSegmentSummary(room);
  if (summary) {
    room.summaries.push(summary);
  }

  room.moderatorMessage = idlePrompt(room);
  clearRaiseQueue(room);

  return serialize(room, participantId);
}

export function advanceAgenda(code: string, participantId: string) {
  const room = getRoomOrThrow(code);
  const participant = getParticipant(room, participantId);

  if (!participant.isHost) {
    throw new Error("FORBIDDEN");
  }

  const summary = buildSegmentSummary(room);
  if (summary) {
    room.summaries.push(summary);
  }

  if (room.currentAgendaIndex < room.agenda.length - 1) {
    room.currentAgendaIndex += 1;
    room.turn = {
      speakerId: null,
      startedAt: null,
      status: "idle",
      round: room.turn.round,
    };
    room.activeSpeech = [];
    room.raiseQueue = [];
    completeAgenda(room);
    room.moderatorMessage = agendaAdvancedPrompt(room);
    touch(room);
  }

  return serialize(room, participantId);
}

export function endDebate(code: string, participantId: string) {
  const room = getRoomOrThrow(code);
  const participant = getParticipant(room, participantId);

  if (!participant.isHost) {
    throw new Error("FORBIDDEN");
  }

  const summary = buildSegmentSummary(room);
  if (summary) {
    room.summaries.push(summary);
  }

  room.status = "ended";
  room.turn = {
    speakerId: null,
    startedAt: null,
    status: "idle",
    round: room.turn.round,
  };
  room.raiseQueue = [];
  room.activeSpeech = [];
  room.finalReport = buildFinalReport(room);
  room.summaries.push({
    id: crypto.randomUUID(),
    agendaItemId: null,
    kind: "final",
    title: "토론 종료 정리",
    content: [
      room.finalReport.agreement,
      room.finalReport.unresolved,
      room.finalReport.nextActions,
    ].join("\n\n"),
    createdAt: now(),
  });
  room.moderatorMessage = "오늘 토론이 종료되었습니다. 정리본을 확인하고 다음 대화에 이어가면 됩니다.";

  room.participants = room.participants.map((entry) => ({
    ...entry,
    score: 0,
    penaltyState: "clear",
    pendingBgmCue: null,
  }));
  touch(room);

  return serialize(room, participantId);
}

export function startSpeech(code: string, participantId: string, startedAt: string) {
  const room = getRoomOrThrow(code);
  getParticipant(room, participantId);

  const existing = room.activeSpeech.find(
    (session) => session.participantId === participantId,
  );

  if (!existing) {
    room.activeSpeech.push({
      participantId,
      startedAt,
    } satisfies ActiveSpeechSession);
  }

  const activeByOthers = room.activeSpeech.find(
    (session) => session.participantId !== participantId,
  );

  let penalty: PenaltyEvent | null = null;

  if (
    activeByOthers ||
    (room.turn.speakerId && room.turn.speakerId !== participantId)
  ) {
    penalty = applyPenalty(
      room,
      participantId,
      "overlap",
      1,
      "겹쳐 말하기가 감지되어 벌점 1점이 추가되었습니다.",
    );
  }

  touch(room);

  return {
    snapshot: serialize(room, participantId),
    penalty,
  };
}

export function endSpeech(code: string, input: EndSpeechInput) {
  const room = getRoomOrThrow(code);
  const participant = getParticipant(room, input.participantId);

  room.activeSpeech = room.activeSpeech.filter(
    (session) => session.participantId !== input.participantId,
  );

  let penaltyScore = 0;
  const newPenalties: PenaltyEvent[] = [];

  if (input.peakVolume >= 0.72) {
    newPenalties.push(
      applyPenalty(
        room,
        input.participantId,
        "tone",
        1,
        "높은 톤 신호가 감지되어 벌점 1점이 추가되었습니다.",
      ),
    );
    penaltyScore += 1;
  }

  const recentPenalty = [...room.penaltyEvents]
    .reverse()
    .find((event) => event.participantId === input.participantId);

  if (
    recentPenalty &&
    Date.parse(input.endedAt) - Date.parse(recentPenalty.createdAt) < 18_000 &&
    recentPenalty.type !== "repeat"
  ) {
    newPenalties.push(
      applyPenalty(
        room,
        input.participantId,
        "repeat",
        1,
        "짧은 시간 안에 다시 경고가 발생해 추가 벌점 1점이 부여되었습니다.",
      ),
    );
    penaltyScore += 1;
  }

  const transcript = input.transcript.trim();
  if (transcript) {
    room.utterances.push({
      id: crypto.randomUUID(),
      participantId: input.participantId,
      participantName: participant.name,
      text: transcript,
      startedAt: input.startedAt,
      endedAt: input.endedAt,
      agendaItemId: agendaId(room),
      penaltyScore,
      peakVolume: input.peakVolume,
      source: input.source,
    });
  }

  touch(room);

  return {
    snapshot: serialize(room, input.participantId),
    penalties: newPenalties,
  };
}
