export type DebateStatus = "waiting" | "active" | "ended";

export type AgendaStatus = "upcoming" | "active" | "complete";

export type TurnStatus = "idle" | "speaking";

export type PenaltyEventType = "overlap" | "tone" | "repeat";

export type PenaltyState = "clear" | "warning" | "cautious" | "bgm";

export type SummaryKind = "segment" | "final";

export type UtteranceSource = "speech" | "manual";

export interface AgendaItem {
  id: string;
  title: string;
  goal: string;
  status: AgendaStatus;
}

export interface Participant {
  id: string;
  name: string;
  joinedAt: string;
  score: number;
  penaltyState: PenaltyState;
  isHost: boolean;
  pendingBgmCue: string | null;
}

export interface SpeakingTurn {
  speakerId: string | null;
  startedAt: string | null;
  status: TurnStatus;
  round: number;
}

export interface RaiseRequest {
  participantId: string;
  participantName: string;
  requestedAt: string;
}

export interface Utterance {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  startedAt: string;
  endedAt: string;
  agendaItemId: string;
  penaltyScore: number;
  peakVolume: number;
  source: UtteranceSource;
}

export interface PenaltyEvent {
  id: string;
  participantId: string;
  participantName: string;
  type: PenaltyEventType;
  points: number;
  reason: string;
  createdAt: string;
}

export interface SummarySnapshot {
  id: string;
  agendaItemId: string | null;
  kind: SummaryKind;
  title: string;
  content: string;
  createdAt: string;
}

export interface FinalReport {
  headline: string;
  agreement: string;
  unresolved: string;
  participantHighlights: string;
  nextActions: string;
  generatedAt: string;
}

export interface ActiveSpeechSession {
  participantId: string;
  startedAt: string;
  overlapRisk: boolean;
  offTurnRisk: boolean;
}

export interface DebateRoom {
  code: string;
  topic: string;
  participantsExpected: number;
  hostId: string;
  status: DebateStatus;
  startedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
  moderatorMessage: string;
  moderatorSpeechMessage: string;
  agenda: AgendaItem[];
  currentAgendaIndex: number;
  participants: Participant[];
  turn: SpeakingTurn;
  raiseQueue: RaiseRequest[];
  utterances: Utterance[];
  penaltyEvents: PenaltyEvent[];
  summaries: SummarySnapshot[];
  finalReport: FinalReport | null;
  activeSpeech: ActiveSpeechSession[];
}

export interface ViewerState {
  participantId: string;
  participantName: string;
  isHost: boolean;
  isCurrentSpeaker: boolean;
  canRaise: boolean;
  canEndTurn: boolean;
  canAdvanceAgenda: boolean;
  canEndDebate: boolean;
  queuePosition: number | null;
  score: number;
  penaltyState: PenaltyState;
  pendingBgmCue: string | null;
  latestPenalty: PenaltyEvent | null;
}

export interface RoomSnapshot {
  room: DebateRoom;
  viewer: ViewerState;
}
