"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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

export function LandingPage() {
  const router = useRouter();
  const [createError, setCreateError] = useState("");
  const [joinError, setJoinError] = useState("");
  const [isCreating, startCreateTransition] = useTransition();
  const [isJoining, startJoinTransition] = useTransition();
  const [topic, setTopic] = useState("우리 가족 여행 예산을 어떻게 정할까?");
  const [participantCount, setParticipantCount] = useState(4);
  const [hostName, setHostName] = useState("엄마");
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState("아빠");

  const handleCreate = () => {
    startCreateTransition(async () => {
      try {
        setCreateError("");
        const payload = await postJson<{ code: string; participantId: string }>(
          "/api/rooms/create",
          {
            topic,
            participantCount,
            hostName,
          },
        );
        router.push(`/room/${payload.code}?participant=${payload.participantId}`);
      } catch (error) {
        setCreateError(error instanceof Error ? error.message : "방 생성에 실패했습니다.");
      }
    });
  };

  const handleJoin = () => {
    startJoinTransition(async () => {
      try {
        setJoinError("");
        const payload = await postJson<{ code: string; participantId: string }>(
          "/api/rooms/join",
          {
            code: joinCode.toUpperCase(),
            name: joinName,
          },
        );
        router.push(`/room/${payload.code}?participant=${payload.participantId}`);
      } catch (error) {
        setJoinError(error instanceof Error ? error.message : "방 참가에 실패했습니다.");
      }
    });
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,230,92,0.62),_transparent_36%),linear-gradient(155deg,_#fff8d7_0%,_#ffe6b4_46%,_#ffd0a4_100%)] px-5 py-6 text-slate-900 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="rounded-[34px] border border-white/70 bg-white/72 p-6 shadow-[0_22px_70px_rgba(255,148,31,0.14)] backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="inline-flex rounded-full bg-[#ff8b2b] px-4 py-2 text-sm font-semibold tracking-[0.18em] text-white uppercase">
                Debate Room
              </span>
              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-6xl">
                가족 토론방
              </h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-700">
                방 코드로 모이면 인원이 다 찼을 때 자동 시작됩니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <span className="rounded-full bg-[#fff2a5] px-4 py-2 text-[#7b4c0f]">자동 시작</span>
              <span className="rounded-full bg-[#ffe4cc] px-4 py-2 text-[#a05012]">사회자 음성 안내</span>
              <span className="rounded-full bg-[#fff7df] px-4 py-2 text-slate-700">선착순 발언</span>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[30px] border border-white/70 bg-white/78 p-6 shadow-[0_18px_60px_rgba(255,148,31,0.12)]">
            <p className="text-sm uppercase tracking-[0.18em] text-[#c46d16]">새 방 만들기</p>
            <div className="mt-5 space-y-4">
              <textarea
                className="min-h-32 w-full rounded-[24px] border border-[#ffd698] bg-[#fff9e8] px-4 py-4 text-base outline-none transition focus:border-[#ff9b35] focus:ring-4 focus:ring-[#ffe18e]"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="토론 주제를 입력하세요."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  className="w-full rounded-[18px] border border-[#ffd698] bg-[#fffdf4] px-4 py-3 outline-none transition focus:border-[#ff9b35] focus:ring-4 focus:ring-[#ffe18e]"
                  value={hostName}
                  onChange={(event) => setHostName(event.target.value)}
                  placeholder="방장 이름"
                />
                <input
                  type="number"
                  min={2}
                  max={8}
                  className="w-full rounded-[18px] border border-[#ffd698] bg-[#fffdf4] px-4 py-3 outline-none transition focus:border-[#ff9b35] focus:ring-4 focus:ring-[#ffe18e]"
                  value={participantCount}
                  onChange={(event) => setParticipantCount(Number(event.target.value))}
                  placeholder="참가 인원"
                />
              </div>
              {createError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{createError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full rounded-full bg-[#ff8b2b] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#f07509] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "방 만드는 중..." : "방 만들기"}
              </button>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/70 bg-white/78 p-6 shadow-[0_18px_60px_rgba(255,148,31,0.12)]">
            <p className="text-sm uppercase tracking-[0.18em] text-[#c46d16]">코드로 참가</p>
            <div className="mt-5 space-y-4">
              <input
                className="w-full rounded-[18px] border border-[#ffd698] bg-[#fffdf4] px-4 py-4 text-lg uppercase tracking-[0.26em] outline-none transition focus:border-[#ff9b35] focus:ring-4 focus:ring-[#ffe18e]"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
              />
              <input
                className="w-full rounded-[18px] border border-[#ffd698] bg-[#fffdf4] px-4 py-3 outline-none transition focus:border-[#ff9b35] focus:ring-4 focus:ring-[#ffe18e]"
                value={joinName}
                onChange={(event) => setJoinName(event.target.value)}
                placeholder="내 이름"
              />
              {joinError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{joinError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full rounded-full bg-[#20160f] px-5 py-4 text-base font-semibold text-[#fff7d8] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isJoining ? "입장 중..." : "방 참가하기"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
