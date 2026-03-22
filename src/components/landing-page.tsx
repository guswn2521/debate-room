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
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,204,140,0.55),_transparent_42%),linear-gradient(160deg,_#fdf5e7_0%,_#f4e6d8_30%,_#ecd9d1_55%,_#d5e1e6_100%)] px-5 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-[36px] border border-white/60 bg-white/70 p-6 shadow-[0_20px_70px_rgba(61,43,22,0.13)] backdrop-blur sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-6">
              <span className="inline-flex rounded-full bg-[#163d3a] px-4 py-2 text-sm font-semibold tracking-[0.18em] text-[#f6e7c8] uppercase">
                Family Debate Room
              </span>
              <div className="space-y-4">
                <h1 className="max-w-4xl text-4xl font-bold leading-tight sm:text-6xl">
                  가족이 싸우지 않고도 끝까지 이야기할 수 있게 만드는 토론 앱
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-slate-700">
                  방 코드로 모이고, AI 사회자가 소주제를 나눠주고, 한 번에 한 사람만 발언하게
                  흐름을 정리합니다. 겹쳐 말하거나 톤이 올라가면 진동과 벌점이 들어오고,
                  마지막엔 합의문과 남은 쟁점이 정리됩니다.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  "6자리 방 코드로 바로 입장",
                  "발언 요청은 선착순, 턴 종료 후 큐 초기화",
                  "브라우저 음성 인식 + 수동 입력 폴백",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-[24px] border border-slate-200 bg-white/90 px-4 py-4 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[30px] bg-[#173f3b] p-6 text-[#f9f3ea] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="space-y-5">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#d2b582]">토론 규칙</p>
                  <h2 className="mt-2 text-2xl font-semibold">기본 모드</h2>
                </div>
                <div className="space-y-3 text-sm leading-7 text-[#f1e3ca]">
                  <p>1. 발언 요청 버튼은 선착순입니다.</p>
                  <p>2. 현재 발언이 끝나면 대기열은 전부 삭제됩니다.</p>
                  <p>3. 겹쳐 말하기와 높은 톤은 벌점이 누적됩니다.</p>
                  <p>4. 벌점 4점 이상이면 다음 발언 때 웃긴 BGM이 나옵니다.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[0_14px_50px_rgba(75,45,25,0.12)] backdrop-blur sm:p-8">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#8b5d33]">방 만들기</p>
                <h2 className="mt-2 text-3xl font-semibold">새 토론 시작</h2>
              </div>
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">토론 주제</span>
                  <textarea
                    className="min-h-32 w-full rounded-[22px] border border-slate-200 bg-[#fffaf3] px-4 py-3 text-base outline-none transition focus:border-[#d38f40] focus:ring-4 focus:ring-[#f5d9b3]"
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">방장 이름</span>
                    <input
                      className="w-full rounded-[18px] border border-slate-200 bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#d38f40] focus:ring-4 focus:ring-[#f5d9b3]"
                      value={hostName}
                      onChange={(event) => setHostName(event.target.value)}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-slate-700">참가 인원</span>
                    <input
                      type="number"
                      min={2}
                      max={8}
                      className="w-full rounded-[18px] border border-slate-200 bg-[#fffaf3] px-4 py-3 outline-none transition focus:border-[#d38f40] focus:ring-4 focus:ring-[#f5d9b3]"
                      value={participantCount}
                      onChange={(event) => setParticipantCount(Number(event.target.value))}
                    />
                  </label>
                </div>
              </div>
              {createError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{createError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleCreate}
                disabled={isCreating}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#c65d32] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#a44822] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "방을 만드는 중..." : "토론방 만들기"}
              </button>
            </div>
          </div>

          <div className="rounded-[32px] border border-white/60 bg-[#fdfaf4]/90 p-6 shadow-[0_14px_50px_rgba(21,53,68,0.1)] backdrop-blur sm:p-8">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[#336b72]">방 참가</p>
                <h2 className="mt-2 text-3xl font-semibold">코드로 바로 입장</h2>
              </div>
              <div className="space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">방 코드</span>
                  <input
                    className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-lg uppercase tracking-[0.28em] outline-none transition focus:border-[#5e9aa2] focus:ring-4 focus:ring-[#d2ecef]"
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value.toUpperCase())}
                    maxLength={6}
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-700">내 이름</span>
                  <input
                    className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#5e9aa2] focus:ring-4 focus:ring-[#d2ecef]"
                    value={joinName}
                    onChange={(event) => setJoinName(event.target.value)}
                  />
                </label>
              </div>
              {joinError ? (
                <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{joinError}</p>
              ) : null}
              <button
                type="button"
                onClick={handleJoin}
                disabled={isJoining}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#195f68] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#0f4b52] disabled:cursor-not-allowed disabled:opacity-60"
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
