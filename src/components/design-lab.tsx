import Link from "next/link";
import { Gowun_Dodum, IBM_Plex_Sans_KR, Noto_Sans_KR } from "next/font/google";

const notoSans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
  palette: string[];
  pageClass: string;
  frameClass: string;
  panelClass: string;
  heroClass: string;
  heroTopClass: string;
  titleClass: string;
  bodyClass: string;
  subtleTextClass: string;
  chipClass: string;
  railWrapClass: string;
  railActiveClass: string;
  railIdleClass: string;
  hostTagClass: string;
  buttonPrimaryClass: string;
  buttonSecondaryClass: string;
  buttonGhostClass: string;
};

const themes: Theme[] = [
  {
    id: "1안",
    name: "Bright Ledger",
    tagline: "정돈된 1안 구조에 선명한 코랄과 코발트를 입힌 버전",
    mood: "가장 안정적인 구조를 유지하면서, 갈색과 남색의 무거움을 덜어 더 밝고 현대적으로 보이게 만든 안입니다.",
    why: "메인 주제는 또렷하고, 전체 인상은 깔끔하며, 색감은 생기가 있어서 현재 피드백에 가장 직접적으로 맞는 방향입니다.",
    palette: ["#FFF8EF", "#FFFFFF", "#FF7A59", "#4F5DFF"],
    pageClass:
      "bg-[radial-gradient(circle_at_top,_rgba(255,122,89,0.11),_transparent_34%),linear-gradient(180deg,_#fffaf3_0%,_#f6f4ff_100%)]",
    frameClass: "border-[#eadfd7] bg-[#fffdf9]",
    panelClass: "border-[#eadfd7] bg-white shadow-[0_18px_46px_rgba(50,36,31,0.07)]",
    heroClass: "border-[#dfe2ff] bg-[#eef1ff]",
    heroTopClass: "bg-[#4f5dff]",
    titleClass: `${ibmPlex.className} text-[#1f2440]`,
    bodyClass: `${notoSans.className} text-[#594f48]`,
    subtleTextClass: "text-[#8f7d71]",
    chipClass: "bg-[#fff0ea] text-[#c95d42]",
    railWrapClass: "bg-[#f1ece4]",
    railActiveClass: "bg-[#4f5dff] text-white",
    railIdleClass: "bg-transparent text-[#aaa093]",
    hostTagClass: "bg-[#eef1ff] text-[#4f5dff] ring-1 ring-[#cdd3ff]",
    buttonPrimaryClass:
      "bg-[#ff7a59] text-white shadow-[0_8px_0_rgba(207,92,61,0.95)] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_4px_0_rgba(207,92,61,0.95)]",
    buttonSecondaryClass:
      "bg-[#4f5dff] text-white shadow-[0_8px_0_rgba(61,73,210,0.95)] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_4px_0_rgba(61,73,210,0.95)]",
    buttonGhostClass:
      "bg-[#fff6f0] text-[#c95d42] shadow-[0_8px_0_rgba(239,219,211,1)] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_4px_0_rgba(239,219,211,1)]",
  },
  {
    id: "2안",
    name: "Soft Signal",
    tagline: "2안의 정돈감을 살리고 체온을 더한 민트-애프리콧 버전",
    mood: "2안처럼 깔끔하고 제품답지만, 차갑고 칙칙한 느낌을 줄이기 위해 민트와 애프리콧을 섞어 더 부드럽게 정리한 안입니다.",
    why: "화면 구성은 제일 프로덕트스럽고, 색만 따뜻하게 다듬어서 정보 정리가 잘 되면서도 딱딱하지 않습니다.",
    palette: ["#F5FBF8", "#FFFFFF", "#2FA38A", "#FF9A6C"],
    pageClass:
      "bg-[radial-gradient(circle_at_top,_rgba(47,163,138,0.12),_transparent_34%),linear-gradient(180deg,_#f7fcfa_0%,_#f3f8f6_100%)]",
    frameClass: "border-[#d9e6e0] bg-[#fbfffd]",
    panelClass: "border-[#d6e4de] bg-white shadow-[0_18px_46px_rgba(27,55,49,0.07)]",
    heroClass: "border-[#d9ece7] bg-[#f5fbf8]",
    heroTopClass: "bg-[#2fa38a]",
    titleClass: `${ibmPlex.className} text-[#1f3733]`,
    bodyClass: `${notoSans.className} text-[#57706a]`,
    subtleTextClass: "text-[#8ca099]",
    chipClass: "bg-[#fff1e7] text-[#c06d45]",
    railWrapClass: "bg-[#ebf1ee]",
    railActiveClass: "bg-[#2fa38a] text-white",
    railIdleClass: "bg-transparent text-[#9aaea7]",
    hostTagClass: "bg-[#ebfbf7] text-[#2fa38a] ring-1 ring-[#b6e3d8]",
    buttonPrimaryClass:
      "bg-[#2fa38a] text-white shadow-[0_8px_0_rgba(35,126,107,0.95)] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_4px_0_rgba(35,126,107,0.95)]",
    buttonSecondaryClass:
      "bg-[#ff9a6c] text-white shadow-[0_8px_0_rgba(213,117,76,0.95)] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_4px_0_rgba(213,117,76,0.95)]",
    buttonGhostClass:
      "bg-[#f4faf7] text-[#2f7a70] shadow-[0_8px_0_rgba(217,231,226,1)] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_4px_0_rgba(217,231,226,1)]",
  },
  {
    id: "3안",
    name: "Rosy Current",
    tagline: "1안 구조를 유지하되 더 밝고 세련된 라이프스타일 톤으로 다듬은 버전",
    mood: "친근함은 살리되 아마추어 느낌은 덜고, 화사한 로즈와 인디고를 균형 있게 사용한 안입니다.",
    why: "밝고 부드러우면서도 촌스럽지 않아서, 가족 서비스의 온기를 유지하며 좀 더 요즘 앱처럼 보이게 합니다.",
    palette: ["#FFF7F3", "#FFFFFF", "#F06F8D", "#5D67E8"],
    pageClass:
      "bg-[radial-gradient(circle_at_top,_rgba(240,111,141,0.11),_transparent_34%),linear-gradient(180deg,_#fffaf7_0%,_#f7f4ff_100%)]",
    frameClass: "border-[#eedfdd] bg-[#fffdfb]",
    panelClass: "border-[#eedddb] bg-white shadow-[0_18px_46px_rgba(70,43,55,0.07)]",
    heroClass: "border-[#e7e3ff] bg-[#f3f1ff]",
    heroTopClass: "bg-[#5d67e8]",
    titleClass: `${gowunDodum.className} font-bold text-[#2f2741]`,
    bodyClass: `${notoSans.className} text-[#6a5b63]`,
    subtleTextClass: "text-[#a08f97]",
    chipClass: "bg-[#ffe8ef] text-[#c95778]",
    railWrapClass: "bg-[#f2ecef]",
    railActiveClass: "bg-[#5d67e8] text-white",
    railIdleClass: "bg-transparent text-[#aa9ca3]",
    hostTagClass: "bg-[#eef0ff] text-[#5d67e8] ring-1 ring-[#cfd4ff]",
    buttonPrimaryClass:
      "bg-[#f06f8d] text-white shadow-[0_8px_0_rgba(205,86,118,0.95)] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_4px_0_rgba(205,86,118,0.95)]",
    buttonSecondaryClass:
      "bg-[#5d67e8] text-white shadow-[0_8px_0_rgba(72,81,196,0.95)] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_4px_0_rgba(72,81,196,0.95)]",
    buttonGhostClass:
      "bg-[#fff4f7] text-[#c95778] shadow-[0_8px_0_rgba(239,221,226,1)] hover:-translate-y-0.5 active:translate-y-[2px] active:shadow-[0_4px_0_rgba(239,221,226,1)]",
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
    <div className={`rounded-[18px] p-1 ${theme.railWrapClass}`}>
      <div className="grid grid-cols-4 gap-1">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`rounded-full px-2 py-2 text-center text-[11px] font-semibold sm:text-xs ${
              index === 2 ? theme.railActiveClass : theme.railIdleClass
            }`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

function SharedPhone({ theme }: { theme: Theme }) {
  return (
    <div className={`rounded-[34px] border p-3 sm:p-4 ${theme.frameClass}`}>
      <div className="mx-auto max-w-sm">
        <ProgressRail theme={theme} />

        <div className={`mt-3 rounded-[28px] border p-5 ${theme.heroClass}`}>
          <div className={`h-2.5 w-24 rounded-full ${theme.heroTopClass}`} />
          <p className={`mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] ${theme.subtleTextClass}`}>
            메인 주제
          </p>
          <h3 className={`mt-3 text-[30px] leading-tight ${theme.titleClass}`}>
            우리 가족 여행 예산을 어떻게 정할까?
          </h3>
          <p className={`mt-4 text-sm leading-7 ${theme.bodyClass}`}>
            현재 소주제: 기대하는 점과 걱정되는 점
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.chipClass}`}>
              지금 발언자 아빠
            </span>
            <span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.chipClass}`}>
              4명 참여 중
            </span>
          </div>
        </div>

        <div className={`mt-3 rounded-[26px] border p-4 ${theme.panelClass}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.subtleTextClass}`}>
                참가자
              </p>
              <p className={`mt-1 text-lg ${theme.titleClass}`}>발언 순서 대기 가능</p>
            </div>
            <button
              type="button"
              className={`rounded-full px-3 py-2 text-xs font-semibold transition ${theme.buttonGhostClass}`}
            >
              사회자 보기
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.name}
                className={`flex items-center justify-between rounded-[18px] border px-3 py-3 ${theme.panelClass}`}
              >
                <div className="flex items-center gap-2">
                  {participant.host ? (
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.hostTagClass}`}>
                      방장
                    </span>
                  ) : null}
                  <span className={`text-sm font-semibold ${theme.titleClass}`}>{participant.name}</span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${theme.chipClass}`}>
                  벌점 {participant.score}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              className={`rounded-full px-4 py-3 text-sm font-semibold transition ${theme.buttonPrimaryClass}`}
            >
              발언 요청
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-3 text-sm font-semibold transition ${theme.buttonSecondaryClass}`}
            >
              규칙 보기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ theme }: { theme: Theme }) {
  return (
    <article className={`rounded-[34px] border p-4 sm:p-5 ${theme.panelClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme.subtleTextClass}`}>
            {theme.id}
          </p>
          <h2 className={`mt-2 text-3xl leading-none ${theme.titleClass}`}>{theme.name}</h2>
          <p className={`mt-2 text-sm font-medium ${theme.bodyClass}`}>{theme.tagline}</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.chipClass}`}>
          1안 구조 기반
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className={`rounded-[24px] border px-4 py-4 ${theme.panelClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.subtleTextClass}`}>
              방향
            </p>
            <p className={`mt-2 text-sm leading-7 ${theme.bodyClass}`}>{theme.mood}</p>
          </div>

          <div className={`mt-3 rounded-[24px] border px-4 py-4 ${theme.panelClass}`}>
            <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.subtleTextClass}`}>
              왜 괜찮은지
            </p>
            <p className={`mt-2 text-sm leading-7 ${theme.bodyClass}`}>{theme.why}</p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {theme.palette.map((color) => (
              <span
                key={color}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.chipClass}`}
              >
                {color}
              </span>
            ))}
          </div>
        </div>

        <SharedPhone theme={theme} />
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
              1안 구조 기반 리파인 샘플 3안
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#5c544a] sm:text-base">
              좋아하신 1안의 구조는 유지하고, 색과 폰트만 더 밝고 세련되게 다듬었습니다.
              진행바는 현재 단계만 활성화되도록 바꿨고, 버튼도 눌렀을 때 손맛이 느껴지도록
              입체감과 그림자를 추가했습니다.
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
          <p className="text-sm font-semibold text-[#4f443b]">빠른 선택 가이드</p>
          <div className="mt-3 space-y-2 text-sm leading-7 text-[#655b52]">
            <p>1안: 가장 균형이 좋고, 지금 피드백에 가장 가깝게 정리된 메인 후보입니다.</p>
            <p>2안: 더 제품답고 깔끔한 인상이 강한 후보입니다.</p>
            <p>3안: 밝고 친근하지만 여전히 세련된 분위기를 원하는 경우에 맞습니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
