"use client";

import type { RoomSnapshot } from "@/lib/debate-types";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

type RoomClientProps = {
  code: string;
};

const POLL_MS = 1500;

function penaltyToneLabel(score: number) {
  if (score >= 4) {
    return "BGM 페널티";
  }

  if (score >= 3) {
    return "주의 단계";
  }

  if (score >= 1) {
    return "경고 단계";
  }

  return "안정";
}

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

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value));
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
    const startTime = audioContext.currentTime + index * 0.16;
    const endTime = startTime + 0.14;
    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.1, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, endTime);
    oscillator.start(startTime);
    oscillator.stop(endTime);
  });
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

export function RoomClient({ code }: RoomClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const participantId = searchParams.get("participant") ?? "";
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [error, setError] = useState("");
  const [manualTranscript, setManualTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [speechSupported, setSpeechSupported] = useState(false);
  const lastPenaltyIdRef = useRef("");
  const lastBgmCueRef = useRef("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
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
    window.navigator.vibrate?.([120, 80, 160]);
  }, [snapshot]);

  useEffect(() => {
    const cue = snapshot?.viewer.pendingBgmCue;
    if (!cue || cue === lastBgmCueRef.current) {
      return;
    }

    lastBgmCueRef.current = cue;
    void playFunnyBgm();
  }, [snapshot]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      audioContextRef.current?.close().catch(() => undefined);
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
    analyserRef.current = analyser;
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
    analyserRef.current = null;
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
    if (!participantId || isListening) {
      return;
    }

    const ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!ctor) {
      setError("이 브라우저는 음성 인식을 지원하지 않습니다. 아래 텍스트 입력을 사용해주세요.");
      return;
    }

    try {
      await beginVolumeTracking();
      await postJson(`/api/rooms/${code}/speech/start`, {
        participantId,
        startedAt: new Date().toISOString(),
      });
    } catch (actionError) {
      cleanupMedia();
      setError(
        actionError instanceof Error
          ? actionError.message
          : "마이크를 시작하지 못했습니다.",
      );
      return;
    }

    const recognition = new ctor();
    recognition.lang = "ko-KR";
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    startedAtRef.current = new Date().toISOString();
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
        setError(actionError instanceof Error ? actionError.message : "수동 발언 저장에 실패했습니다.");
      }
    });
  };

  if (!participantId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4eadf] px-6 text-center">
        <div className="max-w-lg rounded-[30px] bg-white p-8 shadow-xl">
          <p className="text-lg font-semibold text-slate-900">
            참가자 정보가 없습니다. 메인 화면에서 방을 생성하거나 다시 입장해주세요.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 rounded-full bg-[#184e55] px-5 py-3 font-semibold text-white"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,210,153,0.38),_transparent_36%),linear-gradient(160deg,_#f2eee5_0%,_#e8d7cb_28%,_#d7e4e4_56%,_#f5efe4_100%)] px-4 py-5 text-slate-900 sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="overflow-hidden rounded-[34px] border border-white/65 bg-white/75 p-6 shadow-[0_22px_80px_rgba(60,44,20,0.14)] backdrop-blur sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="rounded-full bg-[#1d5c62] px-4 py-2 font-semibold tracking-[0.2em] text-[#f7e6ca] uppercase">
                  Room {code}
                </span>
                {snapshot ? (
                  <span className="rounded-full bg-[#f7ecdd] px-4 py-2 font-semibold text-[#8d5428]">
                    {snapshot.room.status === "ended" ? "토론 종료" : "토론 진행 중"}
                  </span>
                ) : null}
              </div>
              <div className="space-y-3">
                <h1 className="max-w-4xl text-3xl font-bold leading-tight sm:text-5xl">
                  {snapshot?.room.topic ?? "토론방을 불러오는 중입니다."}
                </h1>
                <p className="max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
                  AI 사회자가 소주제를 나눠주고, 발언권은 한 번에 한 사람에게만 주어집니다.
                  현재 발언이 끝나면 손들기 큐는 전부 초기화되고 다시 선착순으로 받습니다.
                </p>
              </div>
            </div>
            <div className="rounded-[28px] bg-[#173f3b] p-5 text-[#f9f3ea]">
              <p className="text-sm uppercase tracking-[0.22em] text-[#d3bc91]">AI 사회자</p>
              <p className="mt-3 text-lg leading-8">{snapshot?.room.moderatorMessage ?? "안내를 준비 중입니다."}</p>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5">
            <div
              className={`rounded-[30px] border p-6 shadow-[0_12px_40px_rgba(25,48,63,0.08)] transition ${
                snapshot?.viewer.isCurrentSpeaker
                  ? "border-[#c35b2f] bg-[linear-gradient(135deg,_#ffdcc5,_#fff2db)]"
                  : "border-white/70 bg-white/80"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#7b5a36]">발언 상태</p>
                  <h2 className="mt-2 text-3xl font-semibold">
                    {snapshot?.viewer.isCurrentSpeaker
                      ? "지금 발언 중"
                      : currentSpeaker
                        ? `${currentSpeaker.name} 발언 중`
                        : "발언권 비어 있음"}
                  </h2>
                </div>
                <div className="rounded-[22px] bg-slate-900 px-4 py-3 text-sm font-medium text-white">
                  턴 시작 {formatDate(snapshot?.room.turn.startedAt ?? null)}
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <button
                  type="button"
                  disabled={isPending || !snapshot?.viewer.canRaise || snapshot.room.status === "ended"}
                  onClick={() =>
                    handleAction(`/api/rooms/${code}/raise`, {
                      participantId,
                    })
                  }
                  className="rounded-full bg-[#c65d32] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#ab4f27] disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="rounded-full bg-[#184e55] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#123d42] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  현재 발언 종료
                </button>
                <div className="rounded-[22px] border border-slate-200 bg-white/90 px-4 py-4 text-sm leading-6 text-slate-700">
                  {snapshot?.viewer.queuePosition
                    ? `내 대기 순서 ${snapshot.viewer.queuePosition}번째`
                    : "현재 턴이 끝나면 대기열이 초기화됩니다."}
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_12px_40px_rgba(25,48,63,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#456f7b]">음성 / 발언 기록</p>
                  <h2 className="mt-2 text-2xl font-semibold">브라우저 음성 인식 또는 수동 입력</h2>
                </div>
                <div className="rounded-full bg-[#edf7f8] px-4 py-2 text-sm font-semibold text-[#1d5c62]">
                  {speechSupported ? "음성 인식 사용 가능" : "텍스트 입력 폴백 모드"}
                </div>
              </div>
              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[24px] bg-[#173f3b] p-5 text-[#f8f1e7]">
                  <p className="text-sm uppercase tracking-[0.18em] text-[#d1b78d]">실시간 캡처</p>
                  <p className="mt-4 min-h-28 text-lg leading-8">
                    {liveTranscript || "마이크를 켜면 여기에 실시간 인식 문장이 보입니다."}
                  </p>
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={isListening ? handleStopSpeech : handleStartSpeech}
                      disabled={!snapshot || snapshot.room.status === "ended"}
                      className={`rounded-full px-5 py-3 text-base font-semibold transition ${
                        isListening
                          ? "bg-[#f1c17a] text-slate-900 hover:bg-[#e8b05c]"
                          : "bg-[#f6e4c8] text-[#173f3b] hover:bg-[#ecd6b5]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      {isListening ? "음성 종료 후 저장" : "마이크로 말하기"}
                    </button>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#e8dbc7]">
                    같은 공간에서 각자 기기를 가까이 두고 말하면 겹침 감지가 조금 더 안정적입니다.
                  </p>
                </div>
                <div className="space-y-3">
                  <textarea
                    className="min-h-40 w-full rounded-[24px] border border-slate-200 bg-[#fffaf3] px-4 py-4 text-base outline-none transition focus:border-[#d38f40] focus:ring-4 focus:ring-[#f6ddba]"
                    value={manualTranscript}
                    onChange={(event) => setManualTranscript(event.target.value)}
                    placeholder="음성 인식이 어렵다면 지금 한 말을 텍스트로 입력해도 됩니다."
                  />
                  <button
                    type="button"
                    onClick={handleManualSubmit}
                    disabled={isPending || !manualTranscript.trim() || snapshot?.room.status === "ended"}
                    className="w-full rounded-full bg-[#2f7682] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#245c65] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    텍스트로 발언 저장
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_12px_40px_rgba(25,48,63,0.08)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#7d6037]">발언 로그</p>
                  <h2 className="mt-2 text-2xl font-semibold">저장된 대화 스크립트</h2>
                </div>
                <div className="rounded-full bg-[#f7ecdd] px-4 py-2 text-sm font-semibold text-[#86542a]">
                  총 {snapshot?.room.utterances.length ?? 0}개 발언
                </div>
              </div>
              <div className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                {snapshot?.room.utterances.length ? (
                  [...snapshot.room.utterances].reverse().map((utterance) => (
                    <article
                      key={utterance.id}
                      className="rounded-[24px] border border-slate-200 bg-[#fcfaf6] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">{utterance.participantName}</span>
                        <span>{formatDate(utterance.endedAt)}</span>
                      </div>
                      <p className="mt-3 text-base leading-7 text-slate-800">{utterance.text}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                        <span className="rounded-full bg-[#e5f1f3] px-3 py-1 text-[#1d5c62]">
                          {utterance.source === "speech" ? "음성 입력" : "텍스트 입력"}
                        </span>
                        <span className="rounded-full bg-[#f7ecdd] px-3 py-1 text-[#8f5c2d]">
                          페널티 반영 {utterance.penaltyScore}점
                        </span>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 px-5 py-8 text-center text-slate-600">
                    아직 저장된 발언이 없습니다. 발언 요청 후 마이크나 텍스트 입력으로 대화를 남겨보세요.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_12px_40px_rgba(25,48,63,0.08)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#7b5a36]">소주제</p>
                  <h2 className="mt-2 text-2xl font-semibold">토론 흐름</h2>
                </div>
                {snapshot?.viewer.canAdvanceAgenda ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleAction(`/api/rooms/${code}/advance-agenda`, {
                        participantId,
                      })
                    }
                    disabled={isPending || snapshot.room.status === "ended"}
                    className="rounded-full bg-[#d0893b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#b87228] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    다음 소주제
                  </button>
                ) : null}
              </div>
              <div className="mt-5 space-y-3">
                {snapshot?.room.agenda.map((item, index) => (
                  <div
                    key={item.id}
                    className={`rounded-[24px] border px-4 py-4 transition ${
                      item.status === "active"
                        ? "border-[#d0893b] bg-[#fff4e3]"
                        : item.status === "complete"
                          ? "border-[#c8d9db] bg-[#eef5f5]"
                          : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{item.goal}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                        {index === snapshot.room.currentAgendaIndex
                          ? "현재"
                          : item.status === "complete"
                            ? "완료"
                            : "대기"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_12px_40px_rgba(25,48,63,0.08)]">
              <p className="text-sm uppercase tracking-[0.2em] text-[#456f7b]">벌점 보드</p>
              <h2 className="mt-2 text-2xl font-semibold">참가자 상태</h2>
              <div className="mt-5 space-y-3">
                {snapshot?.room.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className={`rounded-[24px] border px-4 py-4 ${
                      participant.id === snapshot.viewer.participantId
                        ? "border-[#195f68] bg-[#eef7f8]"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{participant.name}</p>
                        <p className="text-sm text-slate-600">
                          {participant.isHost ? "방장" : "참가자"} · {penaltyToneLabel(participant.score)}
                        </p>
                      </div>
                      <div className="rounded-full bg-[#1b4248] px-4 py-2 text-lg font-bold text-[#f7e4c1]">
                        {participant.score}점
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {snapshot?.viewer.latestPenalty ? (
                <div className="mt-4 rounded-[24px] bg-[#fff2e4] px-4 py-4 text-sm leading-7 text-[#8a5627]">
                  최근 경고: {snapshot.viewer.latestPenalty.reason}
                </div>
              ) : null}
            </div>

            <div className="rounded-[30px] border border-white/70 bg-white/80 p-6 shadow-[0_12px_40px_rgba(25,48,63,0.08)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#7d6037]">요약</p>
                  <h2 className="mt-2 text-2xl font-semibold">중간 정리와 결과물</h2>
                </div>
                {snapshot?.viewer.canEndDebate ? (
                  <button
                    type="button"
                    onClick={() =>
                      handleAction(`/api/rooms/${code}/end-debate`, {
                        participantId,
                      })
                    }
                    disabled={isPending || snapshot.room.status === "ended"}
                    className="rounded-full bg-[#c65d32] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ab4f27] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    토론 종료
                  </button>
                ) : null}
              </div>

              <div className="mt-5 space-y-3">
                {snapshot?.room.summaries.length ? (
                  [...snapshot.room.summaries].reverse().map((summary) => (
                    <article
                      key={summary.id}
                      className="rounded-[24px] border border-slate-200 bg-[#fcfaf6] px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-lg font-semibold text-slate-900">{summary.title}</p>
                        <span className="rounded-full bg-[#edf6f7] px-3 py-1 text-xs font-semibold text-[#195f68]">
                          {summary.kind === "final" ? "최종" : "중간"}
                        </span>
                      </div>
                      <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-700">
                        {summary.content}
                      </pre>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-slate-300 px-5 py-8 text-center text-slate-600">
                    턴 종료나 소주제 전환이 발생하면 자동 요약이 여기에 쌓입니다.
                  </div>
                )}
              </div>

              {snapshot?.room.finalReport ? (
                <div className="mt-5 rounded-[28px] bg-[#173f3b] px-5 py-5 text-[#f8f1e7]">
                  <h3 className="text-2xl font-semibold">{snapshot.room.finalReport.headline}</h3>
                  <div className="mt-4 space-y-4 text-sm leading-7">
                    <p><strong>합의된 내용</strong><br />{snapshot.room.finalReport.agreement}</p>
                    <p><strong>남은 쟁점</strong><br />{snapshot.room.finalReport.unresolved}</p>
                    <p><strong>참가자별 핵심 의견</strong><br />{snapshot.room.finalReport.participantHighlights}</p>
                    <p><strong>다음 행동 제안</strong><br />{snapshot.room.finalReport.nextActions}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
