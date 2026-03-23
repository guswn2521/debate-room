"use client";

import { ScreenProgress } from "@/components/screen-progress";
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
    <main className="flex min-h-screen items-center bg-[radial-gradient(circle_at_top,_rgba(74,90,232,0.06),_transparent_36%),linear-gradient(180deg,_#f8f8f7_0%,_#f2f3f9_100%)] px-3 py-3 text-slate-900 sm:px-5">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
        <ScreenProgress current="home" />

        <section className="rounded-[28px] border border-[#e4e4e7] bg-white/92 px-4 py-4 shadow-[0_12px_32px_rgba(28,25,23,0.07)] backdrop-blur sm:px-6">
          <span className="inline-flex rounded-full bg-[#d96b8d] px-3 py-1.5 text-xs font-semibold tracking-[0.18em] text-white uppercase">
            Debate Room
          </span>
          <h1 className="mt-3 text-3xl font-bold leading-none text-[#18181b] sm:text-5xl">
            가족 토론방
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/design-final")}
              className="rounded-full border border-[#e4e4e7] bg-[#4a5ae8] px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(74,90,232,0.28),0_1px_2px_rgba(0,0,0,0.06)] transition hover:opacity-90"
            >
              최종 디자인 보기
            </button>
            <button
              type="button"
              onClick={() => router.push("/design-samples")}
              className="rounded-full border border-[#e4e4e7] bg-white px-4 py-2 text-sm font-semibold text-[#52525b] transition hover:opacity-80"
            >
              컨셉 탐색 3안
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="rounded-[28px] border border-[#e4e4e7] bg-white/92 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.07)] sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">방 만들기</p>
            <div className="mt-3 space-y-2.5">
              <input
                className="w-full rounded-[13px] border border-[#e4e4e7] bg-[#fffdf9] px-3 py-3 text-sm text-[#18181b] outline-none transition focus:border-[#d96b8d] focus:ring-4 focus:ring-[#eef0ff]"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="토론 주제"
              />
              <input
                className="w-full rounded-[13px] border border-[#e4e4e7] bg-[#fffdf9] px-3 py-3 text-sm text-[#18181b] outline-none transition focus:border-[#d96b8d] focus:ring-4 focus:ring-[#eef0ff]"
                value={hostName}
                onChange={(event) => setHostName(event.target.value)}
                placeholder="방장 이름"
              />
              <input
                type="number"
                min={2}
                max={8}
                className="w-full rounded-[13px] border border-[#e4e4e7] bg-[#fffdf9] px-3 py-3 text-sm text-[#18181b] outline-none transition focus:border-[#d96b8d] focus:ring-4 focus:ring-[#eef0ff]"
                value={participantCount}
                onChange={(event) => setParticipantCount(Number(event.target.value))}
                placeholder="인원"
              />
              {createError ? (
                <p className="rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{createError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="w-full rounded-full bg-[#4a5ae8] px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(74,90,232,0.28),0_1px_2px_rgba(0,0,0,0.06)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "생성 중" : "방 만들기"}
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#e4e4e7] bg-white/92 p-4 shadow-[0_12px_32px_rgba(28,25,23,0.07)] sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a1a1aa]">코드 참가</p>
            <div className="mt-3 space-y-2.5">
              <input
                className="w-full rounded-[13px] border border-[#e4e4e7] bg-[#fffdf9] px-3 py-3 text-center text-base uppercase tracking-[0.22em] text-[#18181b] outline-none transition focus:border-[#d96b8d] focus:ring-4 focus:ring-[#eef0ff]"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                placeholder="ABC123"
                maxLength={6}
              />
              <input
                className="w-full rounded-[13px] border border-[#e4e4e7] bg-[#fffdf9] px-3 py-3 text-sm text-[#18181b] outline-none transition focus:border-[#d96b8d] focus:ring-4 focus:ring-[#eef0ff]"
                value={joinName}
                onChange={(event) => setJoinName(event.target.value)}
                placeholder="내 이름"
              />
              {joinError ? (
                <p className="rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-700">{joinError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full rounded-full bg-[#d96b8d] px-4 py-3 text-sm font-semibold text-white shadow-[0_1px_3px_rgba(217,107,141,0.28),0_1px_2px_rgba(0,0,0,0.06)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isJoining ? "입장 중" : "참가하기"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
