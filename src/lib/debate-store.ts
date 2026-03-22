import {
  agendaAdvancedPrompt,
  buildAgenda,
  buildFinalReport,
  buildSegmentSummary,
  codeFromTopic,
  debateStartedPrompt,
  idlePrompt,
  moderatorIntro,
  penaltyState,
  speakerPrompt,
  waitingPrompt,
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

function syncWaitingState(room: DebateRoom) {
  if (room.status === "ended") {
    return;
  }

  const joined = room.participants.length;
  if (joined >= room.participantsExpected) {
    room.status = "active";
    if (!room.startedAt) {
      room.startedAt = now();
    }
    room.moderatorMessage = debateStartedPrompt(room);
  } else {
    room.status = "waiting";
    room.moderatorMessage = waitingPrompt(joined, room.participantsExpected);
  }
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
    status: "waiting",
    startedAt: null,
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
  syncWaitingState(room);
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
  syncWaitingState(room);
  touch(room);

  return {
    code: room.code,
    participantId: participant.id,
  };
}

export function leaveRoom(code: string, participantId: string) {
  const store = getStore();
  const room = getRoomOrThrow(code);

  if (room.status !== "waiting") {
    throw new Error("LEAVE_ONLY_WAITING");
  }

  getParticipant(room, participantId);

  room.participants = room.participants.filter(
    (participant) => participant.id !== participantId,
  );
  room.raiseQueue = room.raiseQueue.filter(
    (request) => request.participantId !== participantId,
  );
  room.activeSpeech = room.activeSpeech.filter(
    (session) => session.participantId !== participantId,
  );

  if (room.participants.length === 0) {
    store.rooms.delete(room.code);

    return {
      ok: true,
      roomClosed: true,
    };
  }

  if (room.hostId === participantId) {
    room.hostId = room.participants[0].id;
  }

  room.participants = room.participants.map((participant) => ({
    ...participant,
    isHost: participant.id === room.hostId,
  }));

  syncWaitingState(room);
  touch(room);

  return {
    ok: true,
    roomClosed: false,
  };
}

export function getRoomSnapshot(code: string, participantId: string) {
  return serialize(getRoomOrThrow(code), participantId);
}

export function requestRaise(code: string, participantId: string) {
  const room = getRoomOrThrow(code);
  const participant = getParticipant(room, participantId);

  if (room.status === "waiting") {
    throw new Error("WAITING_FOR_PARTICIPANTS");
  }

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
    pendingBgmCue: null,
  }));
  touch(room);

  return serialize(room, participantId);
}

export function startSpeech(code: string, participantId: string, startedAt: string) {
  const room = getRoomOrThrow(code);
  getParticipant(room, participantId);

  if (room.status !== "active") {
    throw new Error("ROOM_NOT_ACTIVE");
  }

  const existing = room.activeSpeech.find(
    (session) => session.participantId === participantId,
  );

  if (!existing) {
    const overlapRisk = room.activeSpeech.some(
      (session) => session.participantId !== participantId,
    );
    const offTurnRisk = Boolean(
      room.turn.speakerId && room.turn.speakerId !== participantId,
    );
    room.activeSpeech.push({
      participantId,
      startedAt,
      overlapRisk,
      offTurnRisk,
    } satisfies ActiveSpeechSession);
  }

  touch(room);

  return {
    snapshot: serialize(room, participantId),
    penalty: null,
  };
}

export function endSpeech(code: string, input: EndSpeechInput) {
  const room = getRoomOrThrow(code);
  const participant = getParticipant(room, input.participantId);
  const session = room.activeSpeech.find(
    (entry) => entry.participantId === input.participantId,
  );

  room.activeSpeech = room.activeSpeech.filter(
    (session) => session.participantId !== input.participantId,
  );

  let penaltyScore = 0;
  const newPenalties: PenaltyEvent[] = [];
  const durationMs = Math.max(
    Date.parse(input.endedAt) - Date.parse(input.startedAt),
    0,
  );
  const transcript = input.transcript.trim();
  const transcriptLength = transcript.replace(/\s+/g, "").length;
  const sustainedSpeech = durationMs >= 2400 || transcriptLength >= 18;

  if (session && sustainedSpeech && (session.overlapRisk || session.offTurnRisk)) {
    newPenalties.push(
      applyPenalty(
        room,
        input.participantId,
        "overlap",
        1,
        "겹쳐 말해 벌점 +1",
      ),
    );
    penaltyScore += 1;
  }

  if (sustainedSpeech && input.peakVolume >= 0.9) {
    newPenalties.push(
      applyPenalty(
        room,
        input.participantId,
        "tone",
        1,
        "목소리가 커져 벌점 +1",
      ),
    );
    penaltyScore += 1;
  }

  const recentPenaltyCount = room.penaltyEvents.filter(
    (event) =>
      event.participantId === input.participantId &&
      Date.parse(input.endedAt) - Date.parse(event.createdAt) < 20_000,
  ).length;

  if (
    sustainedSpeech &&
    newPenalties.length > 0 &&
    recentPenaltyCount >= 2
  ) {
    newPenalties.push(
      applyPenalty(
        room,
        input.participantId,
        "repeat",
        1,
        "경고가 반복돼 벌점 +1",
      ),
    );
    penaltyScore += 1;
  }

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

  participant.pendingBgmCue = null;

  touch(room);

  return {
    snapshot: serialize(room, input.participantId),
    penalties: newPenalties,
  };
}
