import Link from "next/link";
import {
  Gowun_Dodum,
  IBM_Plex_Sans_KR,
  Nanum_Myeongjo,
  Noto_Sans_KR,
} from "next/font/google";

const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ["latin"],
  weight: ["400", "700", "800"],
});

const ibmPlex = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const gowunDodum = Gowun_Dodum({
  subsets: ["latin"],
  weight: "400",
});

type Theme = {
  id: string;
  name: string;
  tagline: string;
  mood: string;
  why: string;
  layoutPoint: string;
  palette: string[];
  shellClass: string;
  pageClass: string;
  cardClass: string;
  softCardClass: string;
  heroClass: string;
  heroTitleClass: string;
  heroBodyClass: string;
  headingClass: string;
  bodyClass: string;
  badgeClass: string;
  hostTagClass: string;
  primaryButtonClass: string;
  secondaryButtonClass: string;
  railActiveClass: string;
  railDoneClass: string;
  railIdleClass: string;
  variant: "editorial" | "signal" | "family";
};

const themes: Theme[] = [
  {
    id: "1안",
    name: "Editorial Hearth",
    tagline: "따뜻하고 정돈된 가족 회의록",
    mood: "1안의 통일감은 유지하면서도, 메인 주제만큼은 더 강하게 읽히게 조정한 방향입니다.",
    why: "차분한 분위기와 높은 가독성을 동시에 잡기 좋아서, 가족 토론 서비스에 가장 안정적으로 맞습니다.",
    layoutPoint:
      "얇은 진행바 아래에 짙은 메인 주제 카드가 먼저 나오고, 참가자와 버튼은 밝은 카드로 내려 위계를 분명하게 나눕니다.",
    palette: ["#F7F1E8", "#FFFDF8", "#8B5E3C", "#2C3E50"],
    shellClass: "border-[#e3d7c8] bg-[#fffdf8]",
    pageClass:
      "bg-[radial-gradient(circle_at_top,_rgba(139,94,60,0.10),_transparent_34%),linear-gradient(180deg,_#fcf7f0_0%,_#f6eee1_100%)]",
    cardClass: "border-[#e3d7c8] bg-[#fffaf4] shadow-[0_20px_50px_rgba(52,38,30,0.08)]",
    softCardClass: "border-[#eadfd2] bg-[#fffdf8]",
    heroClass: "border-[#2c3e50] bg-[#2c3e50]",
    heroTitleClass: `${nanumMyeongjo.className} text-white`,
    heroBodyClass: `${notoSans.className} text-[#ecdfd3]`,
    headingClass: `${nanumMyeongjo.className} text-[#332821]`,
    bodyClass: `${notoSans.className} text-[#625247]`,
    badgeClass: "bg-[#efe3d6] text-[#7b614e]",
    hostTagClass: "bg-[#fff2e5] text-[#8b5e3c] ring-1 ring-[#d9b28b]",
    primaryButtonClass: "bg-[#8b5e3c] text-white hover:bg-[#744e32]",
    secondaryButtonClass: "bg-[#2c3e50] text-white hover:bg-[#243342]",
    railActiveClass: "bg-[#2c3e50] text-white",
    railDoneClass: "bg-[#e8d5c2] text-[#775746]",
    railIdleClass: "bg-transparent text-[#9f8a78]",
    variant: "editorial",
  },
  {
    id: "2안",
    name: "Calm Signal",
    tagline: "깔끔하지만 차갑지 않은 제품 톤",
    mood: "2안의 정돈감은 유지하고, 차갑고 칙칙한 인상을 줄이기 위해 따뜻한 클레이 포인트를 섞었습니다.",
    why: "상태 전환이 많은 앱에서 가장 명확한 구조를 만들면서도, 지나치게 건조해 보이지 않게 잡은 방향입니다.",
    layoutPoint:
      "상단 상태와 주제를 분리하고, 메인 주제는 흰 배경 카드에 컬러 라인과 큰 제목으로 강조합니다. 버튼은 하나의 강한 주색으로 정리합니다.",
    palette: ["#F4F7F6", "#FFFFFF", "#2F7D73", "#E79A63"],
    shellClass: "border-[#d8e2dd] bg-[#fbfefd]",
    pageClass:
      "bg-[radial-gradient(circle_at_top,_rgba(47,125,115,0.10),_transparent_34%),linear-gradient(180deg,_#f7faf9_0%,_#eff5f3_100%)]",
    cardClass: "border-[#d6e2dc] bg-white shadow-[0_18px_46px_rgba(28,57,53,0.08)]",
    softCardClass: "border-[#dce7e1] bg-[#fbfefd]",
    heroClass: "border-[#d7e4de] bg-white",
    heroTitleClass: `${ibmPlex.className} text-[#1f3537]`,
    heroBodyClass: `${notoSans.className} text-[#5d726d]`,
    headingClass: `${ibmPlex.className} text-[#203739]`,
    bodyClass: `${notoSans.className} text-[#60736e]`,
    badgeClass: "bg-[#e6f1ed] text-[#326b65]",
    hostTagClass: "bg-[#edf8f5] text-[#2f7d73] ring-1 ring-[#98d0c4]",
    primaryButtonClass: "bg-[#2f7d73] text-white hover:bg-[#27675f]",
    secondaryButtonClass: "bg-[#fff1e6] text-[#b16032] hover:bg-[#fde7d8]",
    railActiveClass: "bg-[#2f7d73] text-white",
    railDoneClass: "bg-[#dff0eb] text-[#326b65]",
    railIdleClass: "bg-transparent text-[#92a49d]",
    variant: "signal",
  },
  {
    id: "3안",
    name: "Studio Family",
    tagline: "친근하지만 지금 앱다운 온기",
    mood: "3안의 친근함을 유지하되, 색의 채도와 정렬감을 다듬어 옛날 앱처럼 보이지 않게 만든 방향입니다.",
    why: "가족용 서비스의 편안함이 느껴지면서도, 요즘 라이프스타일 앱처럼 밝고 세련된 인상을 줍니다.",
    layoutPoint:
      "메인 주제는 밝은 배경 위 큰 제목으로 띄우고, 참가자 카드는 부드러운 색 블록으로 구분합니다. 버튼은 코랄과 인디고 두 축만 사용합니다.",
    palette: ["#FFF6EE", "#FFE0D2", "#D95C7A", "#5563D6"],
    shellClass: "border-[#f0d7d1] bg-[#fffdfb]",
    pageClass:
      "bg-[radial-gradient(circle_at_top,_rgba(217,92,122,0.11),_transparent_34%),linear-gradient(180deg,_#fff9f5_0%,_#fff2ea_100%)]",
    cardClass: "border-[#f0dad5] bg-[#fffdfb] shadow-[0_18px_46px_rgba(74,41,53,0.08)]",
    softCardClass: "border-[#f0ddda] bg-[#fff7f2]",
    heroClass: "border-[#f3d6cd] bg-[#fff1ea]",
    heroTitleClass: `${gowunDodum.className} font-bold text-[#3d2b35]`,
    heroBodyClass: `${notoSans.className} text-[#795e67]`,
    headingClass: `${gowunDodum.className} font-bold text-[#412f39]`,
    bodyClass: `${notoSans.className} text-[#735f67]`,
    badgeClass: "bg-[#ffe4dd] text-[#b44d66]",
    hostTagClass: "bg-[#eef0ff] text-[#5563d6] ring-1 ring-[#b4bdf3]",
    primaryButtonClass: "bg-[#d95c7a] text-white hover:bg-[#c44d69]",
    secondaryButtonClass: "bg-[#5563d6] text-white hover:bg-[#4452c0]",
    railActiveClass: "bg-[#5563d6] text-white",
    railDoneClass: "bg-[#ffe1d7] text-[#b2576c]",
    railIdleClass: "bg-transparent text-[#b1979d]",
    variant: "family",
  },
];

const steps = ["홈", "대기실", "토론방", "결과보기"];
const participants = [
  { name: "엄마", host: true, score: 0 },
  { name: "아빠", host: false, score: 1 },
  { name: "나", host: false, score: 0 },
  { name: "동생", host: false, score: 2 },
];

function ProgressRail({ theme }: { theme: Theme }) {
  return (
    <div className={`rounded-[18px] p-1 ${theme.badgeClass}`}>
      <div className="grid grid-cols-4 gap-1">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`rounded-full px-2 py-2 text-center text-[11px] font-semibold sm:text-xs ${
              index === 2
                ? theme.railActiveClass
                : index < 2
                  ? theme.railDoneClass
                  : theme.railIdleClass
            }`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorialPhone({ theme }: { theme: Theme }) {
  return (
    <div className={`rounded-[34px] border p-3 sm:p-4 ${theme.shellClass}`}>
      <div className="mx-auto max-w-sm">
        <ProgressRail theme={theme} />

        <div className={`mt-3 rounded-[28px] border p-5 ${theme.heroClass}`}>
          <p className={`text-[11px] uppercase tracking-[0.2em] ${theme.heroBodyClass}`}>
            메인 주제
          </p>
          <h3 className={`mt-3 text-[30px] leading-tight ${theme.heroTitleClass}`}>
            우리 가족 여행 예산을 어떻게 정할까?
          </h3>
          <p className={`mt-4 text-sm ${theme.heroBodyClass}`}>
            현재 소주제: 기대하는 점과 걱정되는 점
          </p>
        </div>

        <div className={`mt-3 rounded-[26px] border p-4 ${theme.softCardClass}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.bodyClass}`}>
                참가자
              </p>
              <p className={`mt-1 text-lg ${theme.headingClass}`}>4명 참여 중</p>
            </div>
            <div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.badgeClass}`}>
              발언 요청 중
            </div>
          </div>

          <div className="mt-3 space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.name}
                className={`flex items-center justify-between rounded-[18px] border px-3 py-3 ${theme.softCardClass}`}
              >
                <div className="flex items-center gap-2">
                  {participant.host ? (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.hostTagClass}`}>
                      방장
                    </span>
                  ) : null}
                  <span className={`text-sm font-semibold ${theme.headingClass}`}>{participant.name}</span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${theme.badgeClass}`}>
                  벌점 {participant.score}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              className={`rounded-full px-4 py-3 text-sm font-semibold transition ${theme.primaryButtonClass}`}
            >
              발언 요청
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-3 text-sm font-semibold transition ${theme.secondaryButtonClass}`}
            >
              규칙 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SignalPhone({ theme }: { theme: Theme }) {
  return (
    <div className={`rounded-[34px] border p-3 sm:p-4 ${theme.shellClass}`}>
      <div className="mx-auto max-w-sm">
        <ProgressRail theme={theme} />

        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
          <div className={`rounded-[20px] px-3 py-2 text-xs font-semibold ${theme.badgeClass}`}>
            토론방 · 4명 입장
          </div>
          <div className={`rounded-[20px] px-3 py-2 text-xs font-semibold ${theme.badgeClass}`}>
            내 차례 아님
          </div>
        </div>

        <div className={`mt-3 rounded-[26px] border p-4 ${theme.heroClass}`}>
          <div className="flex items-start gap-3">
            <div className="mt-1 h-16 w-1.5 rounded-full bg-[#e79a63]" />
            <div className="min-w-0">
              <p className={`text-[11px] uppercase tracking-[0.2em] ${theme.heroBodyClass}`}>
                메인 주제
              </p>
              <h3 className={`mt-2 text-[28px] leading-tight ${theme.heroTitleClass}`}>
                우리 가족 여행 예산을 어떻게 정할까?
              </h3>
              <p className={`mt-3 text-sm ${theme.heroBodyClass}`}>
                현재 소주제: 기대하는 점과 걱정되는 점
              </p>
            </div>
          </div>
        </div>

        <div className={`mt-3 rounded-[26px] border p-4 ${theme.softCardClass}`}>
          <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.bodyClass}`}>
            참가자
          </p>
          <div className="mt-3 space-y-3">
            {participants.map((participant) => (
              <div
                key={participant.name}
                className={`flex items-center justify-between border-b pb-3 last:border-b-0 last:pb-0 ${theme.bodyClass}`}
              >
                <div className="flex items-center gap-2">
                  {participant.host ? (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.hostTagClass}`}>
                      방장
                    </span>
                  ) : null}
                  <span className={`text-sm font-semibold ${theme.headingClass}`}>{participant.name}</span>
                </div>
                <span className="text-xs font-semibold">벌점 {participant.score}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={`mt-4 w-full rounded-full px-4 py-3 text-sm font-semibold transition ${theme.primaryButtonClass}`}
          >
            발언 요청
          </button>
        </div>
      </div>
    </div>
  );
}

function FamilyPhone({ theme }: { theme: Theme }) {
  return (
    <div className={`rounded-[34px] border p-3 sm:p-4 ${theme.shellClass}`}>
      <div className="mx-auto max-w-sm">
        <ProgressRail theme={theme} />

        <div className={`mt-3 rounded-[28px] border p-5 ${theme.heroClass}`}>
          <p className={`text-[11px] uppercase tracking-[0.2em] ${theme.heroBodyClass}`}>
            메인 주제
          </p>
          <h3 className={`mt-2 text-[30px] leading-tight ${theme.heroTitleClass}`}>
            우리 가족 여행 예산을 어떻게 정할까?
          </h3>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.badgeClass}`}>
              소주제 진행 중
            </span>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.badgeClass}`}>
              지금 발언자 아빠
            </span>
          </div>
        </div>

        <div className="mt-3 grid gap-2">
          {participants.map((participant, index) => (
            <div
              key={participant.name}
              className={`flex items-center justify-between rounded-[20px] border px-3 py-3 ${
                index % 2 === 0 ? theme.softCardClass : theme.badgeClass
              }`}
            >
              <div className="flex items-center gap-2">
                {participant.host ? (
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.hostTagClass}`}>
                    방장
                  </span>
                ) : null}
                <span className={`text-sm font-semibold ${theme.headingClass}`}>{participant.name}</span>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${theme.badgeClass}`}>
                벌점 {participant.score}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            className={`rounded-full px-4 py-3 text-sm font-semibold transition ${theme.primaryButtonClass}`}
          >
            발언 요청
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-3 text-sm font-semibold transition ${theme.secondaryButtonClass}`}
          >
            사회자 보기
          </button>
        </div>
      </div>
    </div>
  );
}

function PhonePreview({ theme }: { theme: Theme }) {
  if (theme.variant === "editorial") {
    return <EditorialPhone theme={theme} />;
  }

  if (theme.variant === "signal") {
    return <SignalPhone theme={theme} />;
  }

  return <FamilyPhone theme={theme} />;
}

function PreviewCard({ theme }: { theme: Theme }) {
  return (
    <article className={`rounded-[34px] border p-4 sm:p-5 ${theme.cardClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme.bodyClass}`}>
            {theme.id}
          </p>
          <h2 className={`mt-2 text-3xl leading-none ${theme.headingClass}`}>{theme.name}</h2>
          <p className={`mt-2 text-sm font-medium ${theme.bodyClass}`}>{theme.tagline}</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.badgeClass}`}>
          새 샘플
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div>
          <div className={`rounded-[24px] border px-4 py-4 ${theme.softCardClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.bodyClass}`}>
              핵심 무드
            </p>
            <p className={`mt-2 text-sm leading-7 ${theme.bodyClass}`}>{theme.mood}</p>
          </div>

          <div className={`mt-3 rounded-[24px] border px-4 py-4 ${theme.softCardClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.bodyClass}`}>
              왜 더 나은지
            </p>
            <p className={`mt-2 text-sm leading-7 ${theme.bodyClass}`}>{theme.why}</p>
          </div>

          <div className={`mt-3 rounded-[24px] border px-4 py-4 ${theme.softCardClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.bodyClass}`}>
              레이아웃 포인트
            </p>
            <p className={`mt-2 text-sm leading-7 ${theme.bodyClass}`}>{theme.layoutPoint}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {theme.palette.map((color) => (
              <span
                key={color}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.badgeClass}`}
              >
                {color}
              </span>
            ))}
          </div>
        </div>

        <PhonePreview theme={theme} />
      </div>
    </article>
  );
}

export function DesignLab() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(235,186,85,0.10),_transparent_32%),linear-gradient(180deg,_#fcfaf5_0%,_#f5f1e8_100%)] px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7b5f]">
              Design Lab
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#1e1b18] sm:text-5xl">
              가족 토론방 리디자인 샘플 3안
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5c544a] sm:text-base">
              이전 피드백을 반영해 메인 주제 가독성과 전체 구조를 먼저 다시 잡았습니다.
              이번 샘플은 색만 바꾼 버전이 아니라, 전문 디자이너처럼 위계와 레이아웃까지
              함께 다듬은 비교안입니다.
            </p>
          </div>

          <Link
            href="/"
            className="rounded-full border border-[#ddd0bb] bg-white px-4 py-3 text-sm font-semibold text-[#3f332b] transition hover:bg-[#f8f2e8]"
          >
            메인으로 돌아가기
          </Link>
        </div>

        <div className="mt-6 space-y-5">
          {themes.map((theme) => (
            <section key={theme.id} className={theme.pageClass}>
              <PreviewCard theme={theme} />
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-[28px] border border-[#e5d9c8] bg-white/92 p-5 shadow-[0_16px_42px_rgba(20,33,61,0.06)]">
          <p className="text-sm font-semibold text-[#4f443b]">선택 가이드</p>
          <div className="mt-3 space-y-2 text-sm leading-7 text-[#655b52]">
            <p>1안: 가장 안정적이고 오래 써도 질리지 않는 회의형 분위기입니다.</p>
            <p>2안: 가장 제품답고 정돈됐지만, 이번엔 따뜻함을 더 넣어 차가움을 줄였습니다.</p>
            <p>3안: 가장 친근하고 밝지만, 이전보다 더 세련된 비율과 색으로 다듬었습니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
