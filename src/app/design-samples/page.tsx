import Link from "next/link";

type DesignConcept = {
  id: string;
  name: string;
  subtitle: string;
  mood: string;
  why: string;
  fonts: {
    display: string;
    body: string;
    mono: string;
  };
  tokens: {
    background: string;
    panel: string;
    surface: string;
    text: string;
    muted: string;
    primary: string;
    accent: string;
    rail: string;
    line: string;
  };
};

const concepts: DesignConcept[] = [
  {
    id: "A",
    name: "Editorial Hearth",
    subtitle: "따뜻한 에디토리얼 톤",
    mood: "가족회의 같지만 답답하지 않은, 종이 질감이 느껴지는 정돈된 무드",
    why: "타이포 계층이 분명하고 카드 톤이 안정적이라, 토론 정보가 많아도 피로가 적다.",
    fonts: {
      display: "Georgia, 'Times New Roman', serif",
      body: "'Avenir Next', 'Trebuchet MS', sans-serif",
      mono: "'IBM Plex Mono', monospace",
    },
    tokens: {
      background: "#F8F0E6",
      panel: "#FFF9F3",
      surface: "#F2E2CF",
      text: "#2F241E",
      muted: "#7B685B",
      primary: "#C56A4B",
      accent: "#8D9D7A",
      rail: "#E4D0BE",
      line: "#E7D8C8",
    },
  },
  {
    id: "B",
    name: "Calm Signal",
    subtitle: "차분한 소프트 테크",
    mood: "디지털 서비스처럼 선명하지만, 가족 앱답게 딱딱하지 않은 균형형 무드",
    why: "상태 구분이 명확하고 버튼/배지/카드 톤이 한 체계로 묶여서 모바일 사용성이 가장 안정적이다.",
    fonts: {
      display: "'Avenir Next', 'Segoe UI', sans-serif",
      body: "'Avenir Next', 'Segoe UI', sans-serif",
      mono: "'IBM Plex Mono', monospace",
    },
    tokens: {
      background: "#EEF3F1",
      panel: "#FBFDFC",
      surface: "#DDE9E5",
      text: "#1F2D2A",
      muted: "#5D706A",
      primary: "#287C74",
      accent: "#E98B5B",
      rail: "#D4E1DD",
      line: "#D9E4E0",
    },
  },
  {
    id: "C",
    name: "Studio Family",
    subtitle: "밝은 라이프스타일 브랜드 톤",
    mood: "조금 더 트렌디하고 산뜻한, 가족 서비스 같으면서도 스타트업 제품 같은 무드",
    why: "단순한 대비 대신 2개의 포인트 색을 균형 있게 써서, 지금보다 덜 밋밋하면서도 화면별 일관성이 유지된다.",
    fonts: {
      display: "'Trebuchet MS', 'Avenir Next', sans-serif",
      body: "'Avenir Next', 'Trebuchet MS', sans-serif",
      mono: "'IBM Plex Mono', monospace",
    },
    tokens: {
      background: "#FFF5EE",
      panel: "#FFFFFF",
      surface: "#FFE3D6",
      text: "#2E2430",
      muted: "#786670",
      primary: "#D45C7A",
      accent: "#5867C7",
      rail: "#F1D6DE",
      line: "#F2E3E7",
    },
  },
];

function StageRail({ concept }: { concept: DesignConcept }) {
  const stages = ["홈", "대기실", "토론방", "결과"];

  return (
    <div
      className="grid grid-cols-4 gap-1 rounded-full p-1"
      style={{ backgroundColor: concept.tokens.rail }}
    >
      {stages.map((stage, index) => (
        <div
          key={stage}
          className="rounded-full px-2 py-2 text-center text-[11px] font-semibold"
          style={{
            backgroundColor: index === 2 ? concept.tokens.primary : "transparent",
            color: index === 2 ? "#ffffff" : concept.tokens.muted,
          }}
        >
          {stage}
        </div>
      ))}
    </div>
  );
}

function SamplePhone({ concept }: { concept: DesignConcept }) {
  return (
    <div
      className="mx-auto flex w-full max-w-[320px] flex-col gap-3 rounded-[38px] border p-3 shadow-[0_28px_70px_rgba(15,23,42,0.12)]"
      style={{
        backgroundColor: concept.tokens.background,
        borderColor: concept.tokens.line,
        color: concept.tokens.text,
      }}
    >
      <div
        className="h-1.5 w-20 self-center rounded-full"
        style={{ backgroundColor: concept.tokens.line }}
      />
      <StageRail concept={concept} />

      <section
        className="rounded-[28px] border p-4"
        style={{
          backgroundColor: concept.tokens.panel,
          borderColor: concept.tokens.line,
        }}
      >
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: concept.tokens.muted }}
        >
          메인 주제
        </p>
        <h2
          className="mt-2 text-[26px] leading-none"
          style={{ fontFamily: concept.fonts.display, color: concept.tokens.text }}
        >
          가족 여행 예산
        </h2>
        <div
          className="mt-4 rounded-[22px] p-4"
          style={{ backgroundColor: concept.tokens.surface }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.16em]"
            style={{ color: concept.tokens.muted }}
          >
            현재 토론주제
          </p>
          <p className="mt-2 text-sm font-semibold">
            여행 규모를 정할 때 가장 중요한 기준은 무엇인가요?
          </p>
        </div>
      </section>

      <section
        className="rounded-[28px] border p-4"
        style={{
          backgroundColor: concept.tokens.panel,
          borderColor: concept.tokens.line,
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.18em]"
              style={{ color: concept.tokens.muted }}
            >
              발언 상태
            </p>
            <h3 className="mt-2 text-lg font-semibold">지금 내 차례</h3>
          </div>
          <div
            className="rounded-full px-3 py-2 text-xs font-semibold"
            style={{ backgroundColor: concept.tokens.surface, color: concept.tokens.text }}
          >
            내 순서 1번
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {[
            { name: "엄마", role: "방장", score: 0, current: false },
            { name: "아빠", role: "참가자", score: 1, current: true },
            { name: "딸", role: "참가자", score: 0, current: false },
          ].map((person) => (
            <div
              key={person.name}
              className="flex items-center justify-between rounded-[20px] border px-3 py-3"
              style={{
                backgroundColor: person.current ? concept.tokens.surface : concept.tokens.panel,
                borderColor: person.current ? concept.tokens.primary : concept.tokens.line,
              }}
            >
              <div className="flex items-center gap-2">
                {person.role === "방장" ? (
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{
                      backgroundColor: concept.tokens.primary,
                      color: "#ffffff",
                    }}
                  >
                    방장
                  </span>
                ) : null}
                <div>
                  <p className="text-sm font-semibold">{person.name}</p>
                  <p className="text-xs" style={{ color: concept.tokens.muted }}>
                    {person.role}
                  </p>
                </div>
              </div>
              <div
                className="rounded-full px-3 py-1.5 text-xs font-bold"
                style={{
                  backgroundColor: person.current ? concept.tokens.primary : concept.tokens.surface,
                  color: person.current ? "#ffffff" : concept.tokens.text,
                }}
              >
                {person.score}점
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-full px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: concept.tokens.primary, color: "#ffffff" }}
          >
            발언 요청
          </button>
          <button
            type="button"
            className="rounded-full px-4 py-3 text-sm font-semibold"
            style={{ backgroundColor: concept.tokens.surface, color: concept.tokens.text }}
          >
            발언종료
          </button>
        </div>
      </section>

      <section
        className="rounded-[28px] border p-4"
        style={{
          backgroundColor: concept.tokens.panel,
          borderColor: concept.tokens.line,
        }}
      >
        <div
          className="rounded-[22px] p-4"
          style={{ backgroundColor: concept.tokens.text, color: "#ffffff" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
            실시간 문장
          </p>
          <p className="mt-3 text-sm leading-6">
            이번 여행은 비용보다 다 같이 쉬는 느낌이 더 중요하다고 생각해요.
          </p>
        </div>
      </section>
    </div>
  );
}

function ConceptCard({ concept }: { concept: DesignConcept }) {
  return (
    <article className="grid gap-6 rounded-[36px] border border-[#e6dccf] bg-white/92 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:grid-cols-[1.1fr_0.9fr] lg:p-7">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b6b5d]">
              후보 {concept.id}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#1b1714]">{concept.name}</h2>
            <p className="mt-2 text-base font-medium text-[#5c5249]">{concept.subtitle}</p>
          </div>
          <div
            className="rounded-full px-4 py-2 text-sm font-semibold"
            style={{
              backgroundColor: concept.tokens.surface,
              color: concept.tokens.text,
            }}
          >
            추천 무드
          </div>
        </div>

        <p className="text-base leading-7 text-[#322c27]">{concept.mood}</p>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-[24px] bg-[#faf6ef] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b6b5d]">
              Color Tokens
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                concept.tokens.background,
                concept.tokens.panel,
                concept.tokens.surface,
                concept.tokens.primary,
                concept.tokens.accent,
              ].map((color) => (
                <div key={color} className="space-y-1">
                  <div
                    className="h-10 w-10 rounded-2xl border border-black/5"
                    style={{ backgroundColor: color }}
                  />
                  <p className="text-[10px] font-mono text-[#7b6b5d]">{color}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] bg-[#faf6ef] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b6b5d]">
              Type / Component Tokens
            </p>
            <div className="mt-3 space-y-2 text-sm text-[#322c27]">
              <p>Display: {concept.fonts.display}</p>
              <p>Body: {concept.fonts.body}</p>
              <p>Mono: {concept.fonts.mono}</p>
              <p>Button radius: 9999px</p>
              <p>Card radius: 28px</p>
              <p>Primary CTA: {concept.tokens.primary}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] bg-[#faf6ef] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b6b5d]">
            화면 적용 방식
          </p>
          <div className="mt-3 space-y-2 text-sm leading-7 text-[#322c27]">
            <p>홈: 큰 주제 카드 1개 + 조용한 보조 카드 2개로 시작점 명확화</p>
            <p>대기실: 방코드와 방장 강조를 같은 위계 안에서 보여주고, 인원 상태를 한 번만 설명</p>
            <p>토론방: 메인 주제 카드, 발언 카드, 마이크 카드 3단 구조로 정보 덩어리 정리</p>
            <p>결과보기: 합의/쟁점/벌점 섹션을 동일한 카드 시스템으로 반복</p>
          </div>
        </div>

        <div className="rounded-[24px] bg-[#faf6ef] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b6b5d]">
            선택 이유
          </p>
          <p className="mt-3 text-sm leading-7 text-[#322c27]">{concept.why}</p>
        </div>
      </div>

      <SamplePhone concept={concept} />
    </article>
  );
}

export default function DesignSamplesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(196,164,132,0.12),_transparent_34%),linear-gradient(180deg,_#fdfaf5_0%,_#f6efe5_100%)] px-4 py-6 text-[#1b1714] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-[36px] border border-[#e6dccf] bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] lg:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7b6b5d]">
                Design Lab
              </p>
              <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">
                가족 토론방 디자인 샘플 3안
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-[#4e453d]">
                샘플은 현재 앱의 홈, 대기실, 토론방, 결과보기 구조를 유지한 채
                폰트, 버튼 크기, 카드 위치, 색 체계를 다르게 묶어 본 비교안입니다.
                하나를 고르면 그 방향으로 전체 UI를 일괄 정리하겠습니다.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/"
                className="rounded-full border border-[#d9cfbf] bg-white px-4 py-3 text-sm font-semibold text-[#1b1714] transition hover:bg-[#faf6ef]"
              >
                홈으로
              </Link>
              <div className="rounded-full bg-[#1b1714] px-4 py-3 text-sm font-semibold text-white">
                1안, 2안, 3안 중 선택
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6">
          {concepts.map((concept) => (
            <ConceptCard key={concept.id} concept={concept} />
          ))}
        </div>
      </div>
    </main>
  );
}
