"use client";

import { ScreenProgress } from "@/components/screen-progress";
import type { RoomSnapshot } from "@/lib/debate-types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from "react";

type RoomClientProps = {
  code: string;
};

const POLL_MS = 1500;

async function postJson<T>(url: string, body: Record<string, unknown>) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error ?? "요청에 실패했습니다.");
  }

  return payload;
}

async function fetchRoom(code: string, participantId: string) {
  const response = await fetch(`/api/rooms/${code}?participantId=${participantId}`, {
    cache: "no-store",
  });
  const payload = (await response.json()) as RoomSnapshot & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error ?? "방을 불러오지 못했습니다.");
  }

  return payload;
}

function formatTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
}

function penaltyLabel(score: number) {
  if (score >= 4) {
    return "BGM";
  }

  if (score >= 3) {
    return "주의";
  }

  if (score >= 1) {
    return "경고";
  }

  return "안정";
}

function playFunnyBgm() {
  const audioContext = new window.AudioContext();
  const notes = [523.25, 659.25, 783.99, 659.25, 523.25];
  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    const startTime = audioContext.currentTime + index * 0.17;
    const endTime = startTime + 0.15;
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.08, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
    oscillator.start(startTime);
    oscillator.stop(endTime);
  });
}

function speakMessage(text: string) {
  if (!("speechSynthesis" in window) || !text.trim()) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ko-KR";
  utterance.rate = 1.02;
  utterance.pitch = 1.02;
  window.speechSynthesis.speak(utterance);
}

export function RoomClient({ code }: RoomClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participant") ?? "";
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListeningSession, setIsListeningSession] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showModeratorScript, setShowModeratorScript] = useState(false);
  const [speechSuppressedWhileSpeaking, setSpeechSuppressedWhileSpeaking] =
    useState(false);
  const [isPending, startTransition] = useTransition();
  const lastPenaltyIdRef = useRef("");
  const lastBgmCueRef = useRef("");
  const lastModeratorSpeechRef = useRef("");
  const autoStartedTurnRef = useRef("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const peakVolumeRef = useRef(0);
  const pendingTranscriptBufferRef = useRef("");
  const shouldAutoRestartRecognitionRef = useRef(false);
  const stopRequestedRef = useRef(false);
  const isFinalizingRef = useRef(false);
  const restartTimeoutRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(ctor));
  }, []);

  useEffect(() => {
    if (!participantId) {
      setError("참가자 정보가 없습니다. 메인 화면에서 다시 입장해주세요.");
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const nextSnapshot = await fetchRoom(code, participantId);
        if (!cancelled) {
          setSnapshot(nextSnapshot);
          setError("");
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(
            fetchError instanceof Error ? fetchError.message : "방을 불러오지 못했습니다.",
          );
        }
      }
    }

    void load();
    const interval = window.setInterval(load, POLL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [code, participantId]);

  useEffect(() => {
    const penalty = snapshot?.viewer.latestPenalty;
    if (!penalty || penalty.id === lastPenaltyIdRef.current) {
      return;
    }

    lastPenaltyIdRef.current = penalty.id;
    setToastMessage(penalty.reason);
    window.navigator.vibrate?.([140, 90, 180]);
    const timeout = window.setTimeout(() => setToastMessage(""), 3600);
    return () => window.clearTimeout(timeout);
  }, [snapshot]);

  useEffect(() => {
    const cue = snapshot?.viewer.pendingBgmCue;
    if (!cue || cue === lastBgmCueRef.current) {
      return;
    }

    lastBgmCueRef.current = cue;
    playFunnyBgm();
  }, [snapshot]);

  useEffect(() => {
    const moderatorMessage = snapshot?.room.moderatorSpeechMessage ?? "";
    if (
      speechSuppressedWhileSpeaking ||
      !moderatorMessage ||
      moderatorMessage === lastModeratorSpeechRef.current
    ) {
      return;
    }

    lastModeratorSpeechRef.current = moderatorMessage;
    speakMessage(moderatorMessage);
  }, [snapshot, speechSuppressedWhileSpeaking]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioContextRef.current?.close().catch(() => undefined);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const currentSpeaker = useMemo(() => {
    if (!snapshot?.room.turn.speakerId) {
      return null;
    }

    return (
      snapshot.room.participants.find(
        (participant) => participant.id === snapshot.room.turn.speakerId,
      ) ?? null
    );
  }, [snapshot]);

  const currentAgenda = snapshot?.room.agenda[snapshot.room.currentAgendaIndex] ?? null;
  const recentUtterances = snapshot?.room.utterances.slice(-2).reverse() ?? [];
  const canUseMic = Boolean(
    snapshot?.room.status === "active" && snapshot.viewer.isCurrentSpeaker,
  );
  const currentScreen =
    !snapshot || snapshot.room.status === "waiting"
      ? "waiting"
      : snapshot?.room.status === "active"
        ? "active"
        : "results";

  const cleanupMedia = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }

    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
  };

  const resetListeningState = () => {
    setIsListeningSession(false);
    setSpeechSuppressedWhileSpeaking(false);
    setLiveTranscript("");
    startedAtRef.current = null;
    peakVolumeRef.current = 0;
    pendingTranscriptBufferRef.current = "";
    shouldAutoRestartRecognitionRef.current = false;
    stopRequestedRef.current = false;
    isFinalizingRef.current = false;
    cleanupMedia();
  };

  const beginVolumeTracking = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    mediaStreamRef.current = stream;

    const audioContext = new window.AudioContext();
    audioContextRef.current = audioContext;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let maxDelta = 0;
      for (const sample of data) {
        const normalized = Math.abs(sample - 128) / 128;
        if (normalized > maxDelta) {
          maxDelta = normalized;
        }
      }
      peakVolumeRef.current = Math.max(peakVolumeRef.current, maxDelta);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const finalizeListeningSession = async () => {
    if (isFinalizingRef.current || !startedAtRef.current || !participantId) {
      return;
    }

    isFinalizingRef.current = true;

    try {
      const response = await postJson<{ snapshot: RoomSnapshot }>(
        `/api/rooms/${code}/speech/end`,
        {
          participantId,
          transcript: pendingTranscriptBufferRef.current,
          startedAt: startedAtRef.current,
          endedAt: new Date().toISOString(),
          peakVolume: peakVolumeRef.current,
          source: "speech",
        },
      );
      setSnapshot(response.snapshot);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "발언 저장에 실패했습니다.");
    } finally {
      resetListeningState();
    }
  };

  const startRecognition = () => {
    const ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!ctor) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다.");
      resetListeningState();
      return;
    }

    const recognition = new ctor();
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalText += result[0]?.transcript ?? "";
        } else {
          interimText += result[0]?.transcript ?? "";
        }
      }

      if (finalText) {
        pendingTranscriptBufferRef.current = `${pendingTranscriptBufferRef.current} ${finalText}`.trim();
      }

      const mergedTranscript =
        `${pendingTranscriptBufferRef.current} ${interimText}`.trim() ||
        pendingTranscriptBufferRef.current;
      setLiveTranscript(mergedTranscript);
    };

    recognition.onerror = (event) => {
      if (event.error === "aborted" && stopRequestedRef.current) {
        return;
      }

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("마이크 권한이 필요합니다.");
        shouldAutoRestartRecognitionRef.current = false;
        stopRequestedRef.current = true;
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;

      if (shouldAutoRestartRecognitionRef.current && !stopRequestedRef.current) {
        restartTimeoutRef.current = window.setTimeout(() => {
          startRecognition();
        }, 140);
        return;
      }

      if (stopRequestedRef.current) {
        void finalizeListeningSession();
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleStartSpeech = useEffectEvent(async () => {
    if (!participantId || isListeningSession || !canUseMic) {
      return;
    }

    window.speechSynthesis?.cancel();
    setSpeechSuppressedWhileSpeaking(true);

    try {
      await beginVolumeTracking();
      const startedAt = new Date().toISOString();
      startedAtRef.current = startedAt;
      pendingTranscriptBufferRef.current = "";
      peakVolumeRef.current = 0;
      setLiveTranscript("");

      await postJson(`/api/rooms/${code}/speech/start`, {
        participantId,
        startedAt,
      });
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "마이크를 시작하지 못했습니다.");
      autoStartedTurnRef.current = "";
      resetListeningState();
      return;
    }

    shouldAutoRestartRecognitionRef.current = true;
    stopRequestedRef.current = false;
    isFinalizingRef.current = false;
    setIsListeningSession(true);
    startRecognition();
  });

  useEffect(() => {
    if (!snapshot || !speechSupported || !snapshot.viewer.isCurrentSpeaker || snapshot.room.status !== "active") {
      return;
    }

    const currentTurnKey = `${snapshot.room.turn.round}:${snapshot.viewer.participantId}`;
    if (isListeningSession || autoStartedTurnRef.current === currentTurnKey) {
      return;
    }

    autoStartedTurnRef.current = currentTurnKey;
    void handleStartSpeech();
  }, [snapshot, speechSupported, isListeningSession]);

  const handleLeaveWaitingRoom = () => {
    if (!participantId) {
      router.push("/");
      return;
    }

    startTransition(async () => {
      try {
        await postJson(`/api/rooms/${code}/leave`, {
          participantId,
        });
        router.push("/");
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "홈으로 이동하지 못했습니다.");
      }
    });
  };

  const handleAction = async (url: string, body: Record<string, unknown>) => {
    if (!participantId) {
      return;
    }

    startTransition(async () => {
      try {
        const payload = await postJson<RoomSnapshot>(url, body);
        setSnapshot(payload);
        setError("");
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "요청에 실패했습니다.");
      }
    });
  };

  const handleEndTurn = () => {
    if (!participantId) {
      return;
    }

    startTransition(async () => {
      try {
        if (isListeningSession) {
          shouldAutoRestartRecognitionRef.current = false;
          stopRequestedRef.current = true;
          recognitionRef.current?.stop();
          await finalizeListeningSession();
        }

        const payload = await postJson<RoomSnapshot>(`/api/rooms/${code}/end-turn`, {
          participantId,
        });
        setSnapshot(payload);
        setError("");
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "턴 종료에 실패했습니다.");
      }
    });
  };

  if (!participantId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(43,168,150,0.07),_transparent_36%),linear-gradient(180deg,_#f8f8f7_0%,_#f2f8f7_100%)] px-6 text-center">
        <div className="max-w-lg rounded-[28px] border border-[#e4e4e7] bg-white/92 p-8 shadow-[0_12px_32px_rgba(28,25,23,0.07)]">
          <p className="text-lg font-semibold text-slate-900">
            참가자 정보가 없습니다. 메인 화면에서 다시 입장해주세요.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 rounded-full bg-[#2ba896] px-5 py-3 font-semibold text-white shadow-[0_1px_3px_rgba(43,168,150,0.3),0_1px_2px_rgba(0,0,0,0.06)] transition hover:opacity-90"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  if (snapshot?.room.status === "ended" && snapshot.room.finalReport) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(43,168,150,0.07),_transparent_36%),linear-gradient(180deg,_#f8f8f7_0%,_#f2f8f7_100%)] px-3 py-3 text-slate-900 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <ScreenProgress current="results" />

          <section className="rounded-[30px] border border-[#e4e4e7] bg-white/92 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.07)] sm:p-5">
            <p className="text-sm font-semibold text-[#52525b] sm:text-base">
              메인 주제 · {snapshot.room.topic}
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-[#18181b] sm:text-4xl">
              {snapshot.room.finalReport.headline}
            </h1>
          </section>

          <section className="rounded-[30px] border border-[#e4e4e7] bg-white/92 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.07)] sm:p-5">
            <div className="space-y-4 text-sm leading-7 sm:text-base">
              <p>
                <strong>합의된 내용</strong>
                <br />
                {snapshot.room.finalReport.agreement}
              </p>
              <p>
                <strong>남은 쟁점</strong>
                <br />
                {snapshot.room.finalReport.unresolved}
              </p>
              <p>
                <strong>참가자별 핵심 의견</strong>
                <br />
                {snapshot.room.finalReport.participantHighlights}
              </p>
              <p>
                <strong>다음 행동</strong>
                <br />
                {snapshot.room.finalReport.nextActions}
              </p>
            </div>
          </section>

          <section className="rounded-[30px] border border-[#e4e4e7] bg-white/92 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.07)] sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">
              참가자 벌점
            </p>
            <div className="mt-4 space-y-2">
              {snapshot.room.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-[20px] border border-[#e4e4e7] bg-white px-4 py-3"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">{participant.name}</p>
                    <p className="text-sm text-slate-600">{penaltyLabel(participant.score)}</p>
                  </div>
                  <div className="rounded-full bg-[#e8f7f4] px-4 py-2 text-base font-bold text-[#1d7a6c]">
                    {participant.score}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full rounded-full bg-[#2ba896] px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(43,168,150,0.3),0_1px_2px_rgba(0,0,0,0.06)] transition hover:opacity-90"
          >
            메인으로 돌아가기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(43,168,150,0.07),_transparent_36%),linear-gradient(180deg,_#f8f8f7_0%,_#f2f8f7_100%)] px-3 py-3 text-slate-900 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <ScreenProgress current={currentScreen} />

        <section className="rounded-[30px] border border-[#e4e4e7] bg-white/92 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.07)] backdrop-blur sm:p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div>
              {snapshot?.room.status === "waiting" ? (
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">
                    방코드
                  </p>
                  <div className="inline-flex rounded-full bg-[#2ba896] px-5 py-2 text-2xl font-black tracking-[0.18em] text-white shadow-[0_1px_3px_rgba(43,168,150,0.3),0_1px_2px_rgba(0,0,0,0.06)] sm:text-3xl">
                    {code}
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a1a1aa]">
                    메인 주제
                  </p>
                  <div className="mt-2 text-3xl font-black leading-tight text-[#18181b] sm:text-5xl">
                    {snapshot?.room.topic ?? "토론방 불러오는 중"}
                  </div>
                </>
              )}
              {snapshot?.room.status === "waiting" ? (
                <p className="mt-3 text-sm font-semibold text-[#52525b] sm:text-base">
                  메인 주제 · {snapshot.room.topic}
                </p>
              ) : null}
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold sm:text-sm">
              {snapshot ? (
                <span className="rounded-full bg-[#e8f7f4] px-3 py-2 text-[#1d7a6c]">
                  {snapshot.room.participants.length}/{snapshot.room.participantsExpected}명
                </span>
              ) : null}
              {snapshot?.room.status === "active" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRules((prev) => !prev)}
                    className="rounded-full border-[1.5px] border-[#2ba896] bg-white px-3 py-2 text-[#2ba896] transition hover:bg-[#e8f7f4]"
                  >
                    {showRules ? "규칙 닫기" : "규칙 보기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModeratorScript((prev) => !prev)}
                    className="rounded-full border-[1.5px] border-[#2ba896] bg-white px-3 py-2 text-[#2ba896] transition hover:bg-[#e8f7f4]"
                  >
                    {showModeratorScript ? "사회자 닫기" : "사회자 보기"}
                  </button>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-[#b8e4dc] bg-[#eef9f7] px-4 py-4 text-[#18181b]">
            <div className="mb-3 h-2 w-14 rounded-full bg-[#2ba896]" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">
              {snapshot?.room.status === "waiting" ? "현재 상태" : "현재 토론주제"}
            </p>
            <h1 className="mt-2 text-xl font-bold leading-snug text-[#18181b] sm:text-2xl">
              {snapshot?.room.status === "waiting"
                ? "참가자 기다리는 중"
                : currentAgenda?.title ?? "소주제 준비 중"}
            </h1>
            {snapshot?.room.status === "waiting" ? (
              <p className="mt-3 text-sm leading-6 text-[#52525b] sm:text-base">
                모두 입장하면 자동으로 토론이 시작됩니다.
              </p>
            ) : null}
            {showModeratorScript && snapshot?.room.status === "active" ? (
              <div className="mt-4 rounded-[20px] border border-[#b8e4dc] bg-white px-4 py-4 text-[#18181b]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">
                  AI 사회자
                </p>
                <p className="mt-2 text-sm leading-7 sm:text-base">
                  {snapshot?.room.moderatorMessage ?? "진행 상황을 준비 중입니다."}
                </p>
              </div>
            ) : null}
            {showRules && snapshot?.room.status === "active" ? (
              <div className="mt-4 rounded-[20px] border border-[#e4e4e7] bg-white px-4 py-4 text-[#18181b]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">
                  토론 규칙
                </p>
                <div className="mt-2 space-y-1 text-sm leading-6">
                  <p>1. 발언 요청은 선착순입니다.</p>
                  <p>2. 한 번에 한 사람만 말합니다.</p>
                  <p>3. 발언이 끝나면 요청 큐는 초기화됩니다.</p>
                  <p>4. 겹쳐 말하거나 목소리가 커지면 벌점이 쌓입니다.</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {toastMessage ? (
          <div className="rounded-[24px] border-2 border-[#2ba896] bg-[#e8f7f4] px-4 py-4 text-center text-lg font-bold leading-7 text-[#1d7a6c] shadow-[0_12px_30px_rgba(43,168,150,0.14)]">
            {toastMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {snapshot?.room.status === "waiting" ? (
          <section className="rounded-[30px] border border-[#e4e4e7] bg-white/92 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.07)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                  {snapshot.room.participants.length}명 모였어요
                </h2>
              </div>
              <div className="rounded-[22px] bg-[#e8f7f4] px-4 py-4 text-center text-[#1d7a6c]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em]">남은 인원</p>
                <p className="mt-1 text-3xl font-black">
                  {Math.max(snapshot.room.participantsExpected - snapshot.room.participants.length, 0)}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2">
              {snapshot.room.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-[18px] border border-[#e4e4e7] bg-white px-3 py-3 text-sm font-semibold text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    {participant.isHost ? (
                      <span className="rounded-full bg-[#e8f7f4] px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-[#2ba896]">
                        방장
                      </span>
                    ) : null}
                    <span>{participant.name}</span>
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLeaveWaitingRoom}
              disabled={isPending}
              className="mt-4 w-full rounded-full bg-[#2ba896] px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(43,168,150,0.3),0_1px_2px_rgba(0,0,0,0.06)] transition hover:opacity-90 disabled:opacity-50"
            >
              홈으로 돌아가기
            </button>
          </section>
        ) : null}

        {snapshot?.room.status === "active" ? (
          <section className="flex flex-col gap-3">
            <div className="rounded-[30px] border border-[#e4e4e7] bg-white/92 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.07)] sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">
                    발언 상태
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                    {snapshot.viewer.isCurrentSpeaker
                      ? "지금 내 차례"
                      : currentSpeaker
                        ? `${currentSpeaker.name} 발언 중`
                        : "발언 요청 받는 중"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-700">
                    시작 {formatTime(snapshot.room.turn.startedAt ?? null)}
                  </p>
                </div>
                <div className="rounded-[20px] bg-[#e8f7f4] px-4 py-3 text-sm font-semibold text-[#1d7a6c]">
                  {snapshot.viewer.queuePosition
                    ? `내 순서 ${snapshot.viewer.queuePosition}번`
                    : "턴 종료 후 큐 초기화"}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {snapshot.room.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`rounded-[20px] px-3 py-3 ${
                      participant.id === snapshot.viewer.participantId
                        ? "border border-[#2ba896] bg-[#eef9f7]"
                        : "border border-[#e4e4e7] bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{participant.name}</p>
                        <p className="text-xs text-slate-600">
                          {participant.isHost ? "방장" : "참가자"} · {penaltyLabel(participant.score)}
                        </p>
                      </div>
                      <div className="rounded-full bg-[#e8f7f4] px-3 py-1.5 text-sm font-bold text-[#1d7a6c]">
                        {participant.score}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  disabled={isPending || !snapshot.viewer.canRaise}
                  onClick={() =>
                    handleAction(`/api/rooms/${code}/raise`, {
                      participantId,
                    })
                  }
                  className="rounded-full bg-[#2ba896] px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(43,168,150,0.3),0_1px_2px_rgba(0,0,0,0.06)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  발언 요청
                </button>
                <button
                  type="button"
                  disabled={isPending || !snapshot.viewer.canEndTurn}
                  onClick={handleEndTurn}
                  className="rounded-full bg-[#228f7e] px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(43,168,150,0.3),0_1px_2px_rgba(0,0,0,0.06)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-3"
                >
                  발언종료
                </button>
              </div>

              {snapshot.viewer.canAdvanceAgenda ? (
                <button
                  type="button"
                  onClick={() =>
                    handleAction(`/api/rooms/${code}/advance-agenda`, {
                      participantId,
                    })
                  }
                  disabled={isPending || isListeningSession}
                  className="mt-3 w-full rounded-full border-[1.5px] border-[#2ba896] bg-white px-4 py-3 text-sm font-semibold text-[#2ba896] transition hover:bg-[#e8f7f4] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  다음 소주제
                </button>
              ) : null}

              {snapshot.viewer.canEndDebate ? (
                <button
                  type="button"
                  onClick={() =>
                    handleAction(`/api/rooms/${code}/end-debate`, {
                      participantId,
                    })
                  }
                  disabled={isPending || isListeningSession}
                  className="mt-3 w-full rounded-full bg-[#228f7e] px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(43,168,150,0.3),0_1px_2px_rgba(0,0,0,0.06)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  토론 종료
                </button>
              ) : null}
            </div>

            <div className="rounded-[30px] border border-[#e4e4e7] bg-white/92 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.07)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">
                    마이크 / 기록
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">발언 캡처</h2>
                </div>
                <div className="rounded-full bg-[#e8f7f4] px-3 py-2 text-sm font-semibold text-[#2ba896]">
                  {speechSupported ? "자동 마이크" : "음성 지원 필요"}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[24px] bg-[#eef9f7] p-4 text-[#18181b] lg:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a1a1aa]">
                    실시간 문장
                  </p>
                  <p className="mt-3 min-h-24 text-sm leading-7 sm:text-base">
                    {liveTranscript ||
                      (isListeningSession
                        ? "말하는 동안 문장이 계속 쌓입니다."
                        : canUseMic
                          ? "발언권을 얻으면 마이크가 자동으로 켜집니다."
                          : "발언권을 얻으면 자동으로 마이크가 켜집니다.")}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {recentUtterances.length ? (
                  recentUtterances.map((utterance) => (
                    <article
                      key={utterance.id}
                      className="rounded-[20px] border border-[#e4e4e7] bg-white px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-600 sm:text-sm">
                        <span className="font-semibold text-slate-900">{utterance.participantName}</span>
                        <span>{formatTime(utterance.endedAt)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-800">{utterance.text}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-[#e4e4e7] px-4 py-4 text-center text-sm text-slate-600">
                    최근 발언이 아직 없습니다.
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
