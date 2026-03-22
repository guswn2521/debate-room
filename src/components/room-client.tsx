"use client";

import type { RoomSnapshot } from "@/lib/debate-types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

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
  const [manualTranscript, setManualTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListeningSession, setIsListeningSession] = useState(false);
  const [speechSuppressedWhileSpeaking, setSpeechSuppressedWhileSpeaking] =
    useState(false);
  const [isPending, startTransition] = useTransition();
  const lastPenaltyIdRef = useRef("");
  const lastBgmCueRef = useRef("");
  const lastModeratorMessageRef = useRef("");
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
    const moderatorMessage = snapshot?.room.moderatorMessage ?? "";
    if (
      speechSuppressedWhileSpeaking ||
      !moderatorMessage ||
      moderatorMessage === lastModeratorMessageRef.current
    ) {
      return;
    }

    lastModeratorMessageRef.current = moderatorMessage;
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
      setError("이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트 입력을 사용해주세요.");
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

  const handleStartSpeech = async () => {
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
      resetListeningState();
      return;
    }

    shouldAutoRestartRecognitionRef.current = true;
    stopRequestedRef.current = false;
    isFinalizingRef.current = false;
    setIsListeningSession(true);
    startRecognition();
  };

  const handleStopSpeech = () => {
    if (!isListeningSession) {
      return;
    }

    shouldAutoRestartRecognitionRef.current = false;
    stopRequestedRef.current = true;
    recognitionRef.current?.stop();

    if (!recognitionRef.current) {
      void finalizeListeningSession();
    }
  };

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

  const handleManualSubmit = () => {
    if (!participantId || !manualTranscript.trim()) {
      return;
    }

    startTransition(async () => {
      try {
        const response = await postJson<{ snapshot: RoomSnapshot }>(
          `/api/rooms/${code}/manual-utterance`,
          {
            participantId,
            transcript: manualTranscript.trim(),
          },
        );
        setSnapshot(response.snapshot);
        setManualTranscript("");
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "텍스트 저장에 실패했습니다.");
      }
    });
  };

  if (!participantId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff7d8] px-6 text-center">
        <div className="max-w-lg rounded-[28px] bg-white p-8 shadow-[0_18px_60px_rgba(255,155,40,0.16)]">
          <p className="text-lg font-semibold text-slate-900">
            참가자 정보가 없습니다. 메인 화면에서 다시 입장해주세요.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 rounded-full bg-[#ff8b2b] px-5 py-3 font-semibold text-white"
          >
            홈으로
          </button>
        </div>
      </div>
    );
  }

  if (snapshot?.room.status === "ended" && snapshot.room.finalReport) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,228,92,0.62),_transparent_34%),linear-gradient(160deg,_#fffad7_0%,_#ffe4b8_36%,_#ffd2a8_70%,_#fff0c2_100%)] px-3 py-3 text-slate-900 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <section className="rounded-[30px] border border-white/70 bg-white/78 p-4 shadow-[0_18px_60px_rgba(255,150,36,0.14)] sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c16a16]">
              결과 보기
            </p>
            <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">
              {snapshot.room.finalReport.headline}
            </h1>
          </section>

          <section className="rounded-[30px] border border-white/70 bg-white/78 p-4 shadow-[0_18px_60px_rgba(255,150,36,0.12)] sm:p-5">
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

          <section className="rounded-[30px] border border-white/70 bg-white/78 p-4 shadow-[0_18px_60px_rgba(255,150,36,0.12)] sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c16a16]">
              참가자 벌점
            </p>
            <div className="mt-4 space-y-2">
              {snapshot.room.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between rounded-[20px] bg-[#fff8e5] px-4 py-3"
                >
                  <div>
                    <p className="text-base font-semibold text-slate-900">{participant.name}</p>
                    <p className="text-sm text-slate-600">{penaltyLabel(participant.score)}</p>
                  </div>
                  <div className="rounded-full bg-[#20160f] px-4 py-2 text-base font-bold text-[#ffd447]">
                    {participant.score}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,228,92,0.62),_transparent_34%),linear-gradient(160deg,_#fffad7_0%,_#ffe4b8_36%,_#ffd2a8_70%,_#fff0c2_100%)] px-3 py-3 text-slate-900 sm:px-6">
      <div className="mx-auto flex max-w-5xl flex-col gap-3">
        <section className="rounded-[30px] border border-white/70 bg-white/76 p-4 shadow-[0_18px_60px_rgba(255,152,44,0.16)] backdrop-blur sm:p-5">
          <div className="flex flex-wrap items-start gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c16a16]">
                room code
              </p>
              <div className="mt-2 text-4xl font-black tracking-[0.28em] text-[#20160f] sm:text-6xl">
                {code}
              </div>
            </div>
            <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold sm:text-sm">
              {snapshot ? (
                <span className="rounded-full bg-[#fff2a5] px-3 py-2 text-[#7b4c0f]">
                  {snapshot.room.participants.length}/{snapshot.room.participantsExpected}명
                </span>
              ) : null}
              {snapshot ? (
                <span className="rounded-full bg-[#ffe5cc] px-3 py-2 text-[#a05012]">
                  {snapshot.room.status === "waiting" ? "대기실" : "토론 중"}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-4 rounded-[24px] bg-[#20160f] px-4 py-4 text-[#fff6dc]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd447]">
              메인 주제
            </p>
            <h1 className="mt-2 text-2xl font-bold leading-snug sm:text-3xl">
              {snapshot?.room.topic ?? "토론방 불러오는 중"}
            </h1>
            <div className="mt-4 rounded-[20px] bg-[#2b1f16] px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ffd447]">
                AI 사회자
              </p>
              <p className="mt-2 text-base leading-7 sm:text-lg">
                {snapshot?.room.moderatorMessage ?? "진행 상황을 준비 중입니다."}
              </p>
              {currentAgenda ? (
                <div className="mt-4 rounded-[18px] bg-[#fff7df] px-4 py-3 text-[#20160f]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#c16a16]">
                    현재 소주제
                  </p>
                  <p className="mt-1 text-sm font-semibold sm:text-base">{currentAgenda.title}</p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {toastMessage ? (
          <div className="rounded-[24px] border-2 border-[#ffab52] bg-[#fff0cc] px-4 py-4 text-center text-lg font-bold leading-7 text-[#8f4300] shadow-[0_12px_30px_rgba(255,139,43,0.18)]">
            {toastMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {snapshot?.room.status === "waiting" ? (
          <section className="rounded-[30px] border border-white/70 bg-white/78 p-4 shadow-[0_18px_55px_rgba(255,152,44,0.12)] sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c46d16]">
                  대기실
                </p>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                  {snapshot.room.participants.length}명 모였어요
                </h2>
                <p className="mt-2 text-sm text-slate-700 sm:text-base">
                  모두 입장하면 자동으로 토론이 시작됩니다.
                </p>
              </div>
              <div className="rounded-[22px] bg-[#fff2a5] px-4 py-4 text-center text-[#7b4c0f]">
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
                  className="rounded-[18px] bg-[#fff8df] px-3 py-3 text-sm font-semibold text-slate-800"
                >
                  {participant.name}
                  {participant.isHost ? " · 방장" : ""}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleLeaveWaitingRoom}
              disabled={isPending}
              className="mt-4 w-full rounded-full bg-[#20160f] px-4 py-3 text-sm font-semibold text-[#fff7d8] transition hover:bg-black disabled:opacity-50"
            >
              홈으로 돌아가기
            </button>
          </section>
        ) : null}

        {snapshot?.room.status === "active" ? (
          <section className="flex flex-col gap-3">
            <div className="rounded-[30px] border border-white/70 bg-white/78 p-4 shadow-[0_18px_60px_rgba(255,150,36,0.14)] sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c16a16]">
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
                <div className="rounded-[20px] bg-[#fff8df] px-4 py-3 text-sm font-semibold text-[#7b4c0f]">
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
                        ? "bg-[linear-gradient(135deg,_#fff2a5,_#ffd8ab)]"
                        : "bg-[#fff8e5]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{participant.name}</p>
                        <p className="text-xs text-slate-600">
                          {participant.isHost ? "방장" : "참가자"} · {penaltyLabel(participant.score)}
                        </p>
                      </div>
                      <div className="rounded-full bg-[#20160f] px-3 py-1.5 text-sm font-bold text-[#ffd447]">
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
                  className="rounded-full bg-[#ff8b2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#f07509] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  발언 요청
                </button>
                <button
                  type="button"
                  disabled={isPending || !canUseMic || isListeningSession}
                  onClick={handleStartSpeech}
                  className="rounded-full bg-[#ffd447] px-4 py-3 text-sm font-semibold text-[#6b4300] transition hover:bg-[#f5c52a] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  마이크 사용
                </button>
                <button
                  type="button"
                  disabled={isPending || !isListeningSession}
                  onClick={handleStopSpeech}
                  className="rounded-full bg-[#20160f] px-4 py-3 text-sm font-semibold text-[#fff7d8] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  마이크 종료
                </button>
                <button
                  type="button"
                  disabled={isPending || !snapshot.viewer.canEndTurn || isListeningSession}
                  onClick={handleEndTurn}
                  className="rounded-full bg-[#fff2a5] px-4 py-3 text-sm font-semibold text-[#7b4c0f] transition hover:bg-[#ffe87b] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  턴 종료
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
                  className="mt-3 w-full rounded-full bg-[#fff8df] px-4 py-3 text-sm font-semibold text-[#a05012] transition hover:bg-[#fff0c0] disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="mt-3 w-full rounded-full bg-[#ff8b2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#f07509] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  토론 종료
                </button>
              ) : null}
            </div>

            <div className="rounded-[30px] border border-white/70 bg-white/78 p-4 shadow-[0_18px_60px_rgba(255,150,36,0.12)] sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#c16a16]">
                    마이크 / 기록
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">발언 캡처</h2>
                </div>
                <div className="rounded-full bg-[#fff2a5] px-3 py-2 text-sm font-semibold text-[#7b4c0f]">
                  {speechSupported ? "음성 가능" : "텍스트 모드"}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[24px] bg-[#20160f] p-4 text-[#fff6dc]">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#ffd447]">
                    실시간 문장
                  </p>
                  <p className="mt-3 min-h-24 text-sm leading-7 sm:text-base">
                    {liveTranscript ||
                      (isListeningSession
                        ? "말하는 동안 문장이 계속 쌓입니다."
                        : "내 차례에 마이크 사용을 누르면 발언 종료 전까지 계속 듣습니다.")}
                  </p>
                </div>
                <div className="space-y-3">
                  <textarea
                    className="min-h-28 w-full rounded-[24px] border border-[#ffd698] bg-[#fff9e8] px-4 py-4 text-sm outline-none transition focus:border-[#ff9b35] focus:ring-4 focus:ring-[#ffe18e]"
                    value={manualTranscript}
                    onChange={(event) => setManualTranscript(event.target.value)}
                    placeholder="음성이 어려우면 지금 한 말을 텍스트로 저장해도 됩니다."
                    disabled={!canUseMic || isListeningSession}
                  />
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={
                      isPending ||
                      !manualTranscript.trim() ||
                      !canUseMic ||
                      isListeningSession
                    }
                    className="w-full rounded-full bg-[#20160f] px-4 py-3 text-sm font-semibold text-[#fff7d8] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    텍스트 저장
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {recentUtterances.length ? (
                  recentUtterances.map((utterance) => (
                    <article
                      key={utterance.id}
                      className="rounded-[20px] bg-[#fff8e5] px-4 py-3"
                    >
                      <div className="flex items-center justify-between gap-3 text-xs text-slate-600 sm:text-sm">
                        <span className="font-semibold text-slate-900">{utterance.participantName}</span>
                        <span>{formatTime(utterance.endedAt)}</span>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-800">{utterance.text}</p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[20px] border border-dashed border-[#ffd698] px-4 py-4 text-center text-sm text-slate-600">
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
