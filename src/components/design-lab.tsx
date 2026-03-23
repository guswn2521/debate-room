import Link from "next/link";
import {
  Do_Hyeon,
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

const doHyeon = Do_Hyeon({
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
  surfaceClass: string;
  panelClass: string;
  panelAccentClass: string;
  headingClass: string;
  bodyClass: string;
  badgeClass: string;
  progressActiveClass: string;
  progressDoneClass: string;
  progressIdleClass: string;
  primaryButtonClass: string;
  secondaryButtonClass: string;
  hostBadgeClass: string;
  phoneShellClass: string;
  topicCardClass: string;
  itemClass: string;
};

const themes: Theme[] = [
  {
    id: "1안",
    name: "Editorial Hearth",
    tagline: "따뜻하고 차분한 가족 회의 톤",
    mood: "종이 질감 같은 에디토리얼 무드와 부드러운 여백을 살린 방향입니다.",
    why: "정보량이 많아도 차분하게 읽히고, 가족 토론 특유의 진지함과 온기를 같이 담기 좋습니다.",
    palette: ["#F8F0E6", "#FFF9F3", "#C56A4B", "#8D9D7A"],
    surfaceClass:
      "bg-[radial-gradient(circle_at_top,_rgba(190,109,78,0.10),_transparent_36%),linear-gradient(180deg,_#fbf4ec_0%,_#f6edde_100%)]",
    panelClass: "border-[#e7d7c7] bg-[#fffaf3] shadow-[0_18px_48px_rgba(87,55,38,0.08)]",
    panelAccentClass: "border-[#8b5e3c] bg-[#4d3a32] text-[#fff9f3]",
    headingClass: `${nanumMyeongjo.className} text-[#33241f]`,
    bodyClass: `${notoSans.className} text-[#5f4a3f]`,
    badgeClass: "bg-[#efe1d0] text-[#7d5a45]",
    progressActiveClass: "bg-[#8b5e3c] text-white",
    progressDoneClass: "bg-[#d9c1a9] text-[#6e4e3f]",
    progressIdleClass: "bg-transparent text-[#9a8271]",
    primaryButtonClass: "bg-[#8b5e3c] text-white hover:bg-[#734c31]",
    secondaryButtonClass: "bg-[#ebe2d3] text-[#5f4a3f] hover:bg-[#e2d5c0]",
    hostBadgeClass: "border border-[#b9774a] bg-[#fff1de] text-[#8b5e3c]",
    phoneShellClass: "border-[#eadbc9] bg-[#fffdf8]",
    topicCardClass: "border-[#8b5e3c] bg-[#4d3a32] text-[#fff9f3]",
    itemClass: "border-[#e6d8c8] bg-[#fffaf3]",
  },
  {
    id: "2안",
    name: "Calm Signal",
    tagline: "정돈된 소프트 테크 톤",
    mood: "선명하지만 차갑지 않은 디지털 제품 감성으로, 구조와 상태 전환이 또렷하게 보이도록 설계한 방향입니다.",
    why: "대기실, 토론방, 결과보기처럼 화면 상태가 자주 바뀌는 앱에 가장 실용적이고 깔끔하게 맞습니다.",
    palette: ["#EEF3F1", "#FBFDFC", "#287C74", "#E98B5B"],
    surfaceClass:
      "bg-[radial-gradient(circle_at_top,_rgba(76,196,181,0.12),_transparent_36%),linear-gradient(180deg,_#f4fbfb_0%,_#eef6f7_100%)]",
    panelClass: "border-[#d6e6e5] bg-[#fbffff] shadow-[0_18px_48px_rgba(26,59,76,0.08)]",
    panelAccentClass: "border-[#1c5067] bg-[#143848] text-[#f4fcff]",
    headingClass: `${ibmPlex.className} text-[#163546]`,
    bodyClass: `${ibmPlex.className} text-[#4b6873]`,
    badgeClass: "bg-[#e3f4f2] text-[#2f6f74]",
    progressActiveClass: "bg-[#1c5067] text-white",
    progressDoneClass: "bg-[#d9f0ec] text-[#2f6f74]",
    progressIdleClass: "bg-transparent text-[#88a0a8]",
    primaryButtonClass: "bg-[#1c5067] text-white hover:bg-[#143f53]",
    secondaryButtonClass: "bg-[#ff8a6b] text-white hover:bg-[#ef7658]",
    hostBadgeClass: "border border-[#63c7bb] bg-[#ebfffb] text-[#1f7a73]",
    phoneShellClass: "border-[#dce8e8] bg-[#fbffff]",
    topicCardClass: "border-[#1c5067] bg-[#143848] text-[#f4fcff]",
    itemClass: "border-[#d9e7e6] bg-[#f7fbfb]",
  },
  {
    id: "3안",
    name: "Studio Family",
    tagline: "밝고 트렌디한 라이프스타일 톤",
    mood: "산뜻한 색과 또렷한 제목, 친근한 카드 구조를 조합해 조금 더 살아 있는 분위기를 만드는 방향입니다.",
    why: "지금보다 덜 단순하고 더 친근한 인상을 주면서도, 가족용 서비스의 편안함을 유지할 수 있습니다.",
    palette: ["#FFF5EE", "#FFE3D6", "#D45C7A", "#5867C7"],
    surfaceClass:
      "bg-[radial-gradient(circle_at_top,_rgba(255,174,73,0.16),_transparent_34%),linear-gradient(180deg,_#fffaf0_0%,_#fff4dd_100%)]",
    panelClass: "border-[#eed9af] bg-[#fffdf6] shadow-[0_18px_48px_rgba(118,83,38,0.08)]",
    panelAccentClass: "border-[#d85b3f] bg-[#fff0dd] text-[#4e3425]",
    headingClass: `${doHyeon.className} text-[#3e2a1f]`,
    bodyClass: `${gowunDodum.className} text-[#6b5646]`,
    badgeClass: "bg-[#fff1c4] text-[#8b5e00]",
    progressActiveClass: "bg-[#d85b3f] text-white",
    progressDoneClass: "bg-[#ffe4b3] text-[#8b5e00]",
    progressIdleClass: "bg-transparent text-[#b1997c]",
    primaryButtonClass: "bg-[#d85b3f] text-white hover:bg-[#bf4d33]",
    secondaryButtonClass: "bg-[#8fb08a] text-white hover:bg-[#7b9a76]",
    hostBadgeClass: "border border-[#d85b3f] bg-[#fff1e9] text-[#b54831]",
    phoneShellClass: "border-[#eed9af] bg-[#fffdf7]",
    topicCardClass: "border-[#e4c97a] bg-[#fff5d3] text-[#4e3425]",
    itemClass: "border-[#f0dfb8] bg-[#fffaf0]",
  },
];

const steps = ["홈", "대기실", "토론방", "결과보기"];
const participants = [
  { name: "방장 엄마", host: true, score: 0 },
  { name: "아빠", host: false, score: 1 },
  { name: "나", host: false, score: 0 },
  { name: "동생", host: false, score: 2 },
];

function PreviewCard({ theme }: { theme: Theme }) {
  return (
    <article className={`rounded-[34px] border p-4 sm:p-5 ${theme.panelClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-[0.22em] ${theme.bodyClass}`}>
            {theme.id}
          </p>
          <h2 className={`mt-2 text-3xl leading-none ${theme.headingClass}`}>{theme.name}</h2>
          <p className={`mt-2 text-sm font-medium ${theme.bodyClass}`}>{theme.tagline}</p>
        </div>
        <div className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.badgeClass}`}>
          추천 후보
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div>
          <div className={`rounded-[24px] border px-4 py-4 ${theme.itemClass}`}>
            <p className={`text-sm leading-7 ${theme.bodyClass}`}>{theme.mood}</p>
            <p className={`mt-3 text-sm leading-7 ${theme.bodyClass}`}>{theme.why}</p>
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

        <div className={`rounded-[34px] border p-3 sm:p-4 ${theme.phoneShellClass}`}>
          <div className="mx-auto max-w-sm">
            <div className={`rounded-[20px] p-1 ${theme.badgeClass}`}>
              <div className="grid grid-cols-4 gap-1">
                {steps.map((step, index) => (
                  <div
                    key={step}
                    className={`rounded-full px-2 py-2 text-center text-[11px] font-semibold sm:text-xs ${
                      index === 2
                        ? theme.progressActiveClass
                        : index < 2
                          ? theme.progressDoneClass
                          : theme.progressIdleClass
                    }`}
                  >
                    {step}
                  </div>
                ))}
              </div>
            </div>

            <div className={`mt-3 rounded-[26px] border p-4 ${theme.topicCardClass}`}>
              <p className={`text-[11px] uppercase tracking-[0.2em] ${theme.bodyClass}`}>
                메인 주제
              </p>
              <h3 className={`mt-2 text-2xl leading-tight ${theme.headingClass}`}>
                우리 가족 여행 예산을 어떻게 정할까?
              </h3>
              <p className={`mt-3 text-sm ${theme.bodyClass}`}>
                현재 소주제: 기대하는 점과 걱정되는 점
              </p>
            </div>

            <div className={`mt-3 rounded-[26px] border p-4 ${theme.itemClass}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${theme.bodyClass}`}>
                    참가자
                  </p>
                  <p className={`mt-1 text-base font-semibold ${theme.headingClass}`}>4명 참여 중</p>
                </div>
                <div className={`rounded-full px-3 py-1.5 text-xs font-semibold ${theme.badgeClass}`}>
                  내 차례 아님
                </div>
              </div>

              <div className="mt-3 space-y-2">
                {participants.map((participant) => (
                  <div
                    key={participant.name}
                    className={`flex items-center justify-between rounded-[18px] border px-3 py-3 ${theme.itemClass}`}
                  >
                    <div className="flex items-center gap-2">
                      {participant.host ? (
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${theme.hostBadgeClass}`}>
                          방장
                        </span>
                      ) : null}
                      <span className={`text-sm font-semibold ${theme.headingClass}`}>
                        {participant.name}
                      </span>
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
      </div>
    </article>
  );
}

export function DesignLab() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(235,186,85,0.14),_transparent_34%),linear-gradient(180deg,_#fcfaf4_0%,_#f6f2ea_100%)] px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8b7b5f]">
              Design Lab
            </p>
            <h1 className="mt-2 text-3xl font-semibold leading-tight text-[#1e1b18] sm:text-5xl">
              가족 토론방 디자인 샘플 3안
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5c544a] sm:text-base">
              같은 토론방 화면을 세 가지 디자인 언어로 풀었습니다. 마음에 드는 안을
              골라주시면 그 방향으로 홈, 대기실, 토론방, 결과보기를 한 번에 통일해서
              적용하겠습니다.
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
            <PreviewCard key={theme.id} theme={theme} />
          ))}
        </div>

        <section className="mt-6 rounded-[28px] border border-[#e5d9c8] bg-white/92 p-5 shadow-[0_16px_42px_rgba(20,33,61,0.06)]">
          <p className="text-sm font-semibold text-[#4f443b]">선택 가이드</p>
          <div className="mt-3 space-y-2 text-sm leading-7 text-[#655b52]">
            <p>1안: 차분하고 정돈된 가족 회의 분위기를 원하면 이 안이 가장 안정적입니다.</p>
            <p>2안: 지금 서비스답고 맑은 인상을 원하면 이 안이 가장 균형이 좋습니다.</p>
            <p>3안: 가장 친근하고 생활감 있는 분위기를 원하면 이 안이 잘 맞습니다.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
