import {
  type AgendaItem,
  type DebateRoom,
  type FinalReport,
  type Participant,
  type PenaltyState,
  type SummarySnapshot,
  type Utterance,
} from "@/lib/debate-types";

const agendaBlueprint = [
  {
    suffix: "이 우리 가족에게 왜 중요한지",
    goal: "지금 이 주제가 왜 필요한지 각자 배경과 감정을 꺼내게 한다.",
  },
  {
    suffix: "에 대해 기대하는 점과 걱정되는 점",
    goal: "찬반보다 기대와 불안을 분리해서 듣는다.",
  },
  {
    suffix: "을 위한 현실적인 선택지",
    goal: "실행 가능한 대안을 비교하고 조건을 맞춘다.",
  },
  {
    suffix: "에 대한 오늘의 합의와 다음 행동",
    goal: "결론을 문장으로 남기고 다음 행동을 정한다.",
  },
];

function uniqueFragments(lines: string[]) {
  return Array.from(new Set(lines.map((line) => line.trim()).filter(Boolean)));
}

function trimSentence(text: string, limit = 42) {
  if (text.length <= limit) {
    return text;
  }

  return `${text.slice(0, limit).trim()}...`;
}

export function codeFromTopic() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function buildAgenda(topic: string): AgendaItem[] {
  return agendaBlueprint.map((item, index) => ({
    id: `agenda-${index + 1}`,
    title: `${index + 1}. ${topic}${item.suffix}`,
    goal: item.goal,
    status: index === 0 ? "active" : "upcoming",
  }));
}

export function moderatorIntro(topic: string, expected: number) {
  return `오늘의 주제는 "${topic}"입니다. ${expected}명이 모두 입장하면 바로 토론을 시작할게요.`;
}

export function waitingPrompt(joined: number, expected: number) {
  return [
    `${joined}명 입장했습니다.`,
    `${expected}명이 모두 모이면 토론을 시작합니다.`,
  ].join(" ");
}

export function debateStartedPrompt(room: DebateRoom) {
  const agenda = room.agenda[room.currentAgendaIndex];
  return [
    "모든 참가자가 입장해 토론을 시작합니다.",
    `첫 소주제는 "${agenda.title}"입니다.`,
    "발언 요청은 선착순이고, 턴이 끝나면 요청은 다시 받겠습니다.",
  ].join(" ");
}

export function speakerPrompt(room: DebateRoom, speakerName: string) {
  const agenda = room.agenda[room.currentAgendaIndex];
  return `${speakerName} 차례입니다. "${agenda.title}"에 대해 이야기해주세요.`;
}

export function idlePrompt(room: DebateRoom) {
  const agenda = room.agenda[room.currentAgendaIndex];
  return `발언이 비었습니다. "${agenda.title}"에 대해 말할 분은 발언 요청 버튼을 눌러주세요.`;
}

export function agendaAdvancedPrompt(room: DebateRoom) {
  const agenda = room.agenda[room.currentAgendaIndex];
  return `다음 소주제로 넘어갑니다. "${agenda.title}"를 중심으로 이야기해볼게요.`;
}

export function penaltyState(score: number): PenaltyState {
  if (score >= 4) {
    return "bgm";
  }

  if (score >= 3) {
    return "cautious";
  }

  if (score >= 1) {
    return "warning";
  }

  return "clear";
}

export function buildSegmentSummary(room: DebateRoom): SummarySnapshot | null {
  const agenda = room.agenda[room.currentAgendaIndex];
  const utterances = room.utterances.filter(
    (utterance) => utterance.agendaItemId === agenda.id,
  );

  if (utterances.length === 0) {
    return null;
  }

  const lines = uniqueFragments(
    utterances
      .slice(-4)
      .map((utterance) => `${utterance.participantName}: ${trimSentence(utterance.text, 56)}`),
  );

  const content = [
    "핵심 발언 요약",
    ...lines.map((line) => `- ${line}`),
    "정리",
    `지금까지는 "${agenda.title}"에 대해 위 의견이 중심입니다.`,
  ].join("\n");

  return {
    id: crypto.randomUUID(),
    agendaItemId: agenda.id,
    kind: "segment",
    title: `${agenda.title} 중간 정리`,
    content,
    createdAt: new Date().toISOString(),
  };
}

function participantHighlights(participants: Participant[], utterances: Utterance[]) {
  return participants
    .map((participant) => {
      const latest = utterances
        .filter((utterance) => utterance.participantId === participant.id)
        .slice(-2)
        .map((utterance) => trimSentence(utterance.text, 46));

      if (latest.length === 0) {
        return `- ${participant.name}: 아직 뚜렷한 발언 기록이 적습니다.`;
      }

      return `- ${participant.name}: ${latest.join(" / ")}`;
    })
    .join("\n");
}

export function buildFinalReport(room: DebateRoom): FinalReport {
  const utterances = room.utterances;
  const lastAgenda = room.agenda[room.agenda.length - 1];
  const agreementSource = utterances
    .filter((utterance) => utterance.agendaItemId === lastAgenda.id)
    .slice(-3)
    .map((utterance) => `${utterance.participantName}는 ${trimSentence(utterance.text, 48)}`);

  const tensionSource = room.penaltyEvents.slice(-3).map((event) => event.reason);

  return {
    headline: `"${room.topic}" 토론 결과 정리`,
    agreement:
      agreementSource.length > 0
        ? agreementSource.join(" / ")
        : "오늘은 완전한 합의보다 서로의 기준을 확인하는 데 의미가 있었습니다.",
    unresolved:
      tensionSource.length > 0
        ? `남은 쟁점은 ${tensionSource.join(", ")} 와 관련된 대화 방식 조율입니다.`
        : "큰 갈등 신호 없이 각자의 입장을 비교적 차분하게 확인했습니다.",
    participantHighlights: participantHighlights(room.participants, utterances),
    nextActions: [
      "1. 오늘 나온 공통 기준을 실제 일정이나 규칙으로 옮깁니다.",
      "2. 남은 쟁점은 다음 대화에서 마지막 소주제부터 다시 확인합니다.",
      "3. 벌점이 높았던 순간의 말투나 타이밍을 다음 토론에서 같이 조정합니다.",
    ].join("\n"),
    generatedAt: new Date().toISOString(),
  };
}
