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
  const [isListening, setIsListening] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [speechSupported, setSpeechSupported] = useState(false);
  const lastPenaltyIdRef = useRef("");
  const lastBgmCueRef = useRef("");
  const lastModeratorMessageRef = useRef("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const peakVolumeRef = useRef(0);
  const transcriptRef = useRef("");
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
          setError(fetchError instanceof Error ? fetchError.message : "방을 불러오지 못했습니다.");
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
    window.navigator.vibrate?.([100, 70, 120]);
    const timeout = window.setTimeout(() => setToastMessage(""), 2400);
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
    if (!moderatorMessage || moderatorMessage === lastModeratorMessageRef.current) {
      return;
    }

    lastModeratorMessageRef.current = moderatorMessage;
    speakMessage(moderatorMessage);
  }, [snapshot]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
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
  const recentUtterances = snapshot?.room.utterances.slice(-4).reverse() ?? [];

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

  const cleanupMedia = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
  };

  const handleSpeechStop = async (source: "speech" | "manual" = "speech") => {
    if (!participantId || !startedAtRef.current) {
      return;
    }

    try {
      const response = await postJson<{ snapshot: RoomSnapshot }>(
        `/api/rooms/${code}/speech/end`,
        {
          participantId,
          transcript: transcriptRef.current,
          startedAt: startedAtRef.current,
          endedAt: new Date().toISOString(),
          peakVolume: peakVolumeRef.current,
          source,
        },
      );
      setSnapshot(response.snapshot);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "발언 저장에 실패했습니다.");
    } finally {
      setIsListening(false);
      setLiveTranscript("");
      transcriptRef.current = "";
      startedAtRef.current = null;
      peakVolumeRef.current = 0;
      cleanupMedia();
    }
  };

  const handleStartSpeech = async () => {
    if (!participantId || isListening || !snapshot || snapshot.room.status !== "active") {
      return;
    }

    const ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!ctor) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다. 텍스트 입력을 사용해주세요.");
      return;
    }

    try {
      await beginVolumeTracking();
      const startedAt = new Date().toISOString();
      startedAtRef.current = startedAt;
      await postJson(`/api/rooms/${code}/speech/start`, {
        participantId,
        startedAt,
      });
    } catch (actionError) {
      cleanupMedia();
      setError(actionError instanceof Error ? actionError.message : "마이크를 시작하지 못했습니다.");
      return;
    }

    const recognition = new ctor();
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    transcriptRef.current = "";
    peakVolumeRef.current = 0;
    setLiveTranscript("");
    setIsListening(true);

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

      transcriptRef.current = `${transcriptRef.current} ${finalText}`.trim();
      setLiveTranscript(`${transcriptRef.current} ${interimText}`.trim());
    };

    recognition.onerror = (event) => {
      setError(`음성 인식 오류: ${event.error}`);
    };

    recognition.onend = () => {
      void handleSpeechStop("speech");
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleStopSpeech = () => {
    recognitionRef.current?.stop();
  };

  const handleManualSubmit = async () => {
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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,228,92,0.6),_transparent_34%),linear-gradient(160deg,_#fffad7_0%,_#ffe4b8_36%,_#ffd2a8_70%,_#fff0c2_100%)] px-4 py-4 text-slate-900 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <section className="rounded-[30px] border border-white/70 bg-white/72 p-5 shadow-[0_20px_70px_rgba(255,152,44,0.16)] backdrop-blur sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-[#ff8b2b] px-4 py-2 font-semibold tracking-[0.18em] text-white uppercase">
                  Room {code}
                </span>
                {snapshot ? (
                  <span className="rounded-full bg-[#fff2a5] px-4 py-2 font-semibold text-[#7b4c0f]">
                    {snapshot.room.participants.length}/{snapshot.room.participantsExpected}명
                  </span>
                ) : null}
                {snapshot ? (
                  <span className="rounded-full bg-[#ffe5cc] px-4 py-2 font-semibold text-[#a05012]">
                    {snapshot.room.status === "waiting"
                      ? "대기실"
                      : snapshot.room.status === "active"
                        ? "토론 중"
                        : "종료"}
                  </span>
                ) : null}
              </div>
              <h1 className="max-w-3xl text-3xl font-bold leading-tight sm:text-4xl">
                {snapshot?.room.topic ?? "토론방 불러오는 중"}
              </h1>
            </div>
            <button
              type="button"
              onClick={() => speakMessage(snapshot?.room.moderatorMessage ?? "")}
              disabled={!snapshot?.room.moderatorMessage}
              className="rounded-full bg-[#20160f] px-4 py-3 text-sm font-semibold text-[#fff7d8] transition hover:bg-black disabled:opacity-40"
            >
              사회자 다시 읽기
            </button>
          </div>

          <div className="mt-4 rounded-[24px] bg-[#1e160f] px-5 py-4 text-[#fff6dc]">
            <p className="text-xs uppercase tracking-[0.22em] text-[#ffd76f]">AI 사회자</p>
            <p className="mt-2 text-base leading-7 sm:text-lg">
              {snapshot?.room.moderatorMessage ?? "진행 상황을 준비 중입니다."}
            </p>
          </div>
        </section>

        {toastMessage ? (
          <div className="rounded-[22px] border border-[#ffb271] bg-[#fff1d8] px-4 py-3 text-sm font-semibold text-[#a04f13] shadow-[0_10px_30px_rgba(255,139,43,0.18)]">
            {toastMessage}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {snapshot?.room.status === "waiting" ? (
          <section className="rounded-[30px] border border-white/70 bg-white/78 p-6 shadow-[0_18px_55px_rgba(255,152,44,0.12)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#c46d16]">대기실</p>
                <h2 className="mt-2 text-3xl font-semibold">
                  {snapshot.room.participants.length}명 모였어요
                </h2>
                <p className="mt-2 text-slate-700">
                  모두 입장하면 자동으로 토론이 시작됩니다.
                </p>
              </div>
              <div className="rounded-[26px] bg-[#fff2a5] px-6 py-5 text-center text-[#7b4c0f]">
                <p className="text-sm font-semibold">시작까지</p>
                <p className="mt-1 text-4xl font-bold">
                  {Math.max(snapshot.room.participantsExpected - snapshot.room.participants.length, 0)}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              {snapshot.room.participants.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-full bg-[#fff8df] px-4 py-3 text-sm font-semibold text-slate-800"
                >
                  {participant.name}
                  {participant.isHost ? " · 방장" : ""}
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {snapshot?.room.status !== "waiting" ? (
          <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div
                className={`rounded-[30px] border p-5 shadow-[0_18px_60px_rgba(255,150,36,0.14)] ${
                  snapshot?.viewer.isCurrentSpeaker
                    ? "border-[#ff9b35] bg-[linear-gradient(135deg,_#fff3a9,_#ffd6a8)]"
                    : "border-white/70 bg-white/78"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#c16a16]">현재 턴</p>
                    <h2 className="mt-2 text-3xl font-semibold">
                      {snapshot?.viewer.isCurrentSpeaker
                        ? "지금 발언 중"
                        : currentSpeaker
                          ? `${currentSpeaker.name} 발언 중`
                          : "발언 요청 받는 중"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-700">
                      시작 {formatTime(snapshot?.room.turn.startedAt ?? null)}
                    </p>
                  </div>
                  <div className="rounded-[24px] bg-[#fff8df] px-4 py-3 text-sm font-semibold text-[#7b4c0f]">
                    {snapshot?.viewer.queuePosition
                      ? `내 순서 ${snapshot.viewer.queuePosition}번`
                      : "턴 종료 후 큐 초기화"}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={isPending || !snapshot?.viewer.canRaise || snapshot.room.status !== "active"}
                    onClick={() =>
                      handleAction(`/api/rooms/${code}/raise`, {
                        participantId,
                      })
                    }
                    className="rounded-full bg-[#ff8b2b] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#f07509] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    발언 요청
                  </button>
                  <button
                    type="button"
                    disabled={isPending || !snapshot?.viewer.canEndTurn}
                    onClick={() =>
                      handleAction(`/api/rooms/${code}/end-turn`, {
                        participantId,
                      })
                    }
                    className="rounded-full bg-[#20160f] px-5 py-4 text-base font-semibold text-[#fff7d8] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    발언 끝내기
                  </button>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(255,150,36,0.12)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#c16a16]">소주제</p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      {currentAgenda?.title ?? "현재 소주제 없음"}
                    </h2>
                    <p className="mt-2 text-sm text-slate-700">{currentAgenda?.goal}</p>
                  </div>
                  {snapshot?.viewer.canAdvanceAgenda && snapshot.room.status === "active" ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleAction(`/api/rooms/${code}/advance-agenda`, {
                          participantId,
                        })
                      }
                      disabled={isPending}
                      className="rounded-full bg-[#ffd447] px-4 py-3 text-sm font-semibold text-[#6b4300] transition hover:bg-[#f5c52a] disabled:opacity-50"
                    >
                      다음 소주제
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {snapshot?.room.agenda.map((item, index) => (
                    <div
                      key={item.id}
                      className={`rounded-full px-3 py-2 text-xs font-semibold ${
                        index === snapshot.room.currentAgendaIndex
                          ? "bg-[#ff8b2b] text-white"
                          : item.status === "complete"
                            ? "bg-[#fff1d8] text-[#9e5b11]"
                            : "bg-[#fff8df] text-slate-600"
                      }`}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(255,150,36,0.12)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#c16a16]">발언 입력</p>
                    <h2 className="mt-2 text-2xl font-semibold">말하거나 짧게 적기</h2>
                  </div>
                  <div className="rounded-full bg-[#fff2a5] px-4 py-2 text-sm font-semibold text-[#7b4c0f]">
                    {speechSupported ? "음성 가능" : "텍스트 모드"}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[24px] bg-[#20160f] p-4 text-[#fff6dc]">
                    <p className="text-xs uppercase tracking-[0.2em] text-[#ffd447]">실시간</p>
                    <p className="mt-3 min-h-20 text-base leading-7">
                      {liveTranscript || "마이크를 켜면 여기에 실시간 문장이 표시됩니다."}
                    </p>
                    <button
                      type="button"
                      onClick={isListening ? handleStopSpeech : handleStartSpeech}
                      disabled={!snapshot || snapshot.room.status !== "active"}
                      className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold transition ${
                        isListening
                          ? "bg-[#ffcf48] text-[#4b2d00] hover:bg-[#f1bd18]"
                          : "bg-[#ff8b2b] text-white hover:bg-[#f07509]"
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {isListening ? "마이크 종료" : "마이크 시작"}
                    </button>
                  </div>
                  <div className="space-y-3">
                    <textarea
                      className="min-h-32 w-full rounded-[24px] border border-[#ffd698] bg-[#fff9e8] px-4 py-4 text-base outline-none transition focus:border-[#ff9b35] focus:ring-4 focus:ring-[#ffe18e]"
                      value={manualTranscript}
                      onChange={(event) => setManualTranscript(event.target.value)}
                      placeholder="말한 내용을 짧게 적어도 저장됩니다."
                    />
                    <button
                      type="button"
                      onClick={handleManualSubmit}
                      disabled={isPending || !manualTranscript.trim() || snapshot?.room.status !== "active"}
                      className="w-full rounded-full bg-[#20160f] px-4 py-3 text-sm font-semibold text-[#fff7d8] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      텍스트 저장
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(255,150,36,0.12)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#c16a16]">최근 발언</p>
                    <h2 className="mt-2 text-2xl font-semibold">최신 4개만 표시</h2>
                  </div>
                  <div className="rounded-full bg-[#fff2a5] px-4 py-2 text-sm font-semibold text-[#7b4c0f]">
                    총 {snapshot?.room.utterances.length ?? 0}개
                  </div>
                </div>
                <div className="mt-4 space-y-3">
                  {recentUtterances.length ? (
                    recentUtterances.map((utterance) => (
                      <article
                        key={utterance.id}
                        className="rounded-[22px] bg-[#fff8e5] px-4 py-3"
                      >
                        <div className="flex items-center justify-between gap-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-900">{utterance.participantName}</span>
                          <span>{formatTime(utterance.endedAt)}</span>
                        </div>
                        <p className="mt-2 text-sm leading-7 text-slate-800">{utterance.text}</p>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-dashed border-[#ffd698] px-4 py-6 text-center text-sm text-slate-600">
                      아직 저장된 발언이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(255,150,36,0.12)]">
                <p className="text-sm uppercase tracking-[0.2em] text-[#c16a16]">참가자</p>
                <div className="mt-4 space-y-3">
                  {snapshot?.room.participants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`rounded-[24px] px-4 py-4 ${
                        participant.id === snapshot.viewer.participantId
                          ? "bg-[linear-gradient(135deg,_#fff2a5,_#ffd8ab)]"
                          : "bg-[#fff8e5]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{participant.name}</p>
                          <p className="text-sm text-slate-600">
                            {participant.isHost ? "방장" : "참가자"} · {penaltyLabel(participant.score)}
                          </p>
                        </div>
                        <div className="rounded-full bg-[#20160f] px-4 py-2 text-base font-bold text-[#ffd447]">
                          {participant.score}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-white/70 bg-white/78 p-5 shadow-[0_18px_60px_rgba(255,150,36,0.12)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#c16a16]">마무리</p>
                    <h2 className="mt-2 text-2xl font-semibold">토론 종료 후 결과 보기</h2>
                  </div>
                  {snapshot?.viewer.canEndDebate && snapshot.room.status === "active" ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleAction(`/api/rooms/${code}/end-debate`, {
                          participantId,
                        })
                      }
                      disabled={isPending}
                      className="rounded-full bg-[#ff8b2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#f07509] disabled:opacity-50"
                    >
                      토론 종료
                    </button>
                  ) : null}
                </div>

                {snapshot?.room.status === "ended" && snapshot.room.finalReport ? (
                  <div className="mt-4 rounded-[24px] bg-[#20160f] p-5 text-[#fff6dc]">
                    <h3 className="text-2xl font-semibold">{snapshot.room.finalReport.headline}</h3>
                    <div className="mt-4 space-y-4 text-sm leading-7">
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
                  </div>
                ) : (
                  <div className="mt-4 rounded-[24px] bg-[#fff8e5] px-4 py-5 text-sm leading-7 text-slate-700">
                    중간 요약은 숨기고, 종료 시 최종 정리만 보여줍니다.
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
