import Link from "next/link";
import { IBM_Plex_Sans_KR, Noto_Sans_KR } from "next/font/google";

const ibm = IBM_Plex_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

// ─── Design Tokens ───────────────────────────────────────────────────────────
const C = {
  bg: "#F8F8F7",
  surface: "#FFFFFF",
  primary: "#4A5AE8",
  primaryDark: "#3A48C8",
  accent: "#D96B8D",
  accentDark: "#B85575",
  text100: "#18181B",
  text200: "#52525B",
  text300: "#A1A1AA",
  border: "#E4E4E7",
  chipBg: "#FBF0F4",
  chipText: "#B84870",
  hostBg: "#EEF0FF",
  hostText: "#4A5AE8",
  railBg: "#F0F0EF",
  railActive: "#4A5AE8",
  railComplete: "#EEF0FF",
  railCompleteText: "#4A5AE8",
  heroAccentBg: "#EEF0FF",
  heroAccentBorder: "#DDE0FF",
} as const;

// ─── Atom Components ─────────────────────────────────────────────────────────

function Rail({ active }: { active: 0 | 1 | 2 | 3 }) {
  const steps = ["홈", "대기실", "토론방", "결과보기"];
  return (
    <div className="rounded-[18px] p-1" style={{ background: C.railBg }}>
      <div className="grid grid-cols-4 gap-1">
        {steps.map((s, i) => (
          <div
            key={s}
            className="rounded-full py-1.5 text-center text-[10px] font-semibold"
            style={
              i === active
                ? { background: C.railActive, color: "#fff" }
                : i < active
                  ? { background: C.railComplete, color: C.railCompleteText }
                  : { background: "transparent", color: C.text300 }
            }
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

function Chip({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "host" | "green" | "accent";
}) {
  const styles: Record<string, React.CSSProperties> = {
    default: { background: C.chipBg, color: C.chipText },
    host: { background: C.hostBg, color: C.hostText },
    green: { background: "#EDFBF3", color: "#1A7D49" },
    accent: { background: C.hostBg, color: C.accent },
  };
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={styles[variant]}
    >
      {children}
    </span>
  );
}

function Btn({
  children,
  variant = "primary",
  disabled = false,
  fullWidth = false,
  small = false,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  disabled?: boolean;
  fullWidth?: boolean;
  small?: boolean;
}) {
  const base = `rounded-full font-medium transition select-none ${small ? "px-3 py-1.5 text-[12px]" : "px-5 py-2.5 text-sm"}`;
  const widthClass = fullWidth ? "w-full" : "";

  let style: React.CSSProperties = {};
  if (variant === "primary") {
    style = {
      background: disabled ? "#E4E4E7" : C.primary,
      color: disabled ? "#A1A1AA" : "#fff",
      boxShadow: disabled ? "none" : "0 1px 3px rgba(74,90,232,0.28), 0 1px 2px rgba(0,0,0,0.06)",
    };
  } else if (variant === "secondary") {
    style = {
      background: disabled ? "#E4E4E7" : C.accent,
      color: disabled ? "#A1A1AA" : "#fff",
      boxShadow: disabled ? "none" : "0 1px 3px rgba(217,107,141,0.28), 0 1px 2px rgba(0,0,0,0.06)",
    };
  } else {
    style = {
      background: "transparent",
      color: C.text200,
      border: `1px solid ${C.border}`,
    };
  }

  return (
    <button type="button" className={`${base} ${widthClass}`} style={style} disabled={disabled}>
      {children}
    </button>
  );
}

function Panel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[22px] border p-4 ${className}`}
      style={{
        borderColor: C.border,
        background: C.surface,
        boxShadow: "0 12px 32px rgba(28,25,23,0.07)",
      }}
    >
      {children}
    </div>
  );
}

function FieldMock({
  value,
  placeholder,
  center = false,
  label,
}: {
  value?: string;
  placeholder: string;
  center?: boolean;
  label?: string;
}) {
  return (
    <div>
      {label ? (
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: C.text300 }}>
          {label}
        </p>
      ) : null}
      <div
        className={`w-full rounded-[13px] border px-3 py-2.5 text-[13px] ${center ? "text-center tracking-[0.18em]" : ""}`}
        style={{
          borderColor: C.border,
          background: "#FFFDF9",
          color: value ? C.text100 : C.text300,
        }}
      >
        {value ?? placeholder}
      </div>
    </div>
  );
}

function PhoneFrame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <p
        className={`text-xs font-semibold uppercase tracking-[0.2em] ${ibm.className}`}
        style={{ color: C.text300 }}
      >
        {label}
      </p>
      <div
        className="flex w-[320px] shrink-0 flex-col rounded-[36px] p-3"
        style={{
          border: `1.5px solid ${C.border}`,
          background: "#FFFDFB",
          boxShadow: "0 28px 70px rgba(15,23,42,0.12)",
        }}
      >
        <div
          className="mx-auto mb-3 h-[5px] w-[90px] rounded-full"
          style={{ background: "#E8E0D8" }}
        />
        <div className="flex flex-col gap-3">{children}</div>
        <div
          className="mx-auto mt-3 h-[5px] w-16 rounded-full"
          style={{ background: "#E8E0D8" }}
        />
      </div>
    </div>
  );
}

function SectionHeader({ tag, title }: { tag: string; title: string }) {
  return (
    <div className="mb-5">
      <p
        className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${noto.className}`}
        style={{ color: C.text300 }}
      >
        {tag}
      </p>
      <h2
        className={`mt-1.5 text-2xl font-bold sm:text-3xl ${ibm.className}`}
        style={{ color: C.text100 }}
      >
        {title}
      </h2>
    </div>
  );
}

// ─── Screen Mockups ───────────────────────────────────────────────────────────

function HomeScreen() {
  return (
    <PhoneFrame label="01 홈">
      <div>
        <span
          className={`inline-flex rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white ${ibm.className}`}
          style={{ background: C.accent }}
        >
          Debate Room
        </span>
      </div>
      <Rail active={0} />
      <div className="px-0.5">
        <p
          className={`text-[11px] font-semibold uppercase tracking-[0.2em] ${noto.className}`}
          style={{ color: C.text300 }}
        >
          가족 토론방
        </p>
        <h2
          className={`mt-1.5 text-[27px] font-bold leading-tight ${ibm.className}`}
          style={{ color: C.text100 }}
        >
          건강한 대화를
          <br />
          나눠보세요
        </h2>
      </div>
      <Panel>
        <p
          className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] ${noto.className}`}
          style={{ color: C.text300 }}
        >
          방 만들기
        </p>
        <div className="flex flex-col gap-2">
          <FieldMock value="우리 가족 여행 예산을 어떻게 정할까?" placeholder="토론 주제" />
          <FieldMock value="엄마" placeholder="방장 이름" />
          <FieldMock value="4명" placeholder="인원 수" />
          <Btn variant="primary" fullWidth>
            방 만들기
          </Btn>
        </div>
      </Panel>
      <Panel>
        <p
          className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] ${noto.className}`}
          style={{ color: C.text300 }}
        >
          코드로 참가
        </p>
        <div className="flex flex-col gap-2">
          <FieldMock value="GHK391" placeholder="ABC123" center />
          <FieldMock value="아빠" placeholder="내 이름" />
          <Btn variant="secondary" fullWidth>
            참가하기
          </Btn>
        </div>
      </Panel>
    </PhoneFrame>
  );
}

function WaitingScreen() {
  const participants = [
    { name: "엄마", host: true, joined: true },
    { name: "아빠", host: false, joined: true },
    { name: "나", host: false, joined: true },
    { name: "동생", host: false, joined: false },
  ];
  return (
    <PhoneFrame label="02 대기실">
      <Rail active={1} />
      <div
        className="rounded-[20px] border p-4"
        style={{ borderColor: C.heroAccentBorder, background: C.heroAccentBg }}
      >
        <div className="flex items-start justify-between">
          <p
            className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${noto.className}`}
            style={{ color: C.accent }}
          >
            방 코드
          </p>
          <span
            className={`rounded-full px-2.5 py-1 text-[12px] font-bold text-white ${ibm.className}`}
            style={{ background: C.accent }}
          >
            GHK391
          </span>
        </div>
        <h3
          className={`mt-2.5 text-[17px] font-bold leading-snug ${ibm.className}`}
          style={{ color: C.text100 }}
        >
          우리 가족 여행 예산을
          <br />
          어떻게 정할까?
        </h3>
        <div className="mt-2.5 flex gap-2">
          <Chip variant="accent">3 / 4 입장함</Chip>
        </div>
      </div>
      <Panel>
        <p
          className={`mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${noto.className}`}
          style={{ color: C.text300 }}
        >
          참가자
        </p>
        <div className="flex flex-col gap-1.5">
          {participants.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-[15px] border px-3 py-2.5"
              style={{
                borderColor: p.joined ? C.border : "#EBEBEB",
                background: p.joined ? C.surface : "#F7F7F7",
                opacity: p.joined ? 1 : 0.55,
              }}
            >
              <div className="flex items-center gap-2">
                {p.host ? <Chip variant="host">방장</Chip> : null}
                <span
                  className={`text-sm font-semibold ${ibm.className}`}
                  style={{ color: p.joined ? C.text100 : C.text300 }}
                >
                  {p.name}
                </span>
                {!p.joined ? (
                  <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                    대기 중
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[11px] font-medium ${noto.className}`}
                style={{ color: C.text300 }}
              >
                벌점 0
              </span>
            </div>
          ))}
        </div>
        <p
          className={`mt-3 text-[11px] leading-5 ${noto.className}`}
          style={{ color: C.text300 }}
        >
          동생 입장을 기다리는 중...
        </p>
        <div className="mt-3">
          <Btn variant="primary" fullWidth disabled>
            토론 시작 (방장 전용)
          </Btn>
        </div>
      </Panel>
    </PhoneFrame>
  );
}

function DebateScreen() {
  const participants = [
    { name: "엄마", host: true, score: 0, speaking: false, queue: false },
    { name: "아빠", host: false, score: 1, speaking: true, queue: false },
    { name: "나", host: false, score: 0, speaking: false, queue: true },
    { name: "동생", host: false, score: 2, speaking: false, queue: false },
  ];
  return (
    <PhoneFrame label="03 토론방">
      <Rail active={2} />
      <div
        className="rounded-[20px] border p-4"
        style={{ borderColor: C.heroAccentBorder, background: C.heroAccentBg }}
      >
        <div
          className="mb-3 h-2 w-14 rounded-full"
          style={{ background: C.primary }}
        />
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${noto.className}`}
          style={{ color: C.text300 }}
        >
          메인 주제
        </p>
        <h3
          className={`mt-2 text-[22px] font-bold leading-tight ${ibm.className}`}
          style={{ color: C.text100 }}
        >
          우리 가족 여행 예산을 어떻게 정할까?
        </h3>
        <p
          className={`mt-2 text-[13px] ${noto.className}`}
          style={{ color: C.text200 }}
        >
          현재 소주제: 기대하는 점과 걱정되는 점
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Chip>지금 발언자 아빠</Chip>
          <Chip variant="accent">4명 참여 중</Chip>
        </div>
      </div>
      <div
        className="rounded-[15px] border px-3 py-2.5"
        style={{ borderColor: "#ECE5DC", background: "#FFFBF4" }}
      >
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${noto.className}`}
          style={{ color: C.text300 }}
        >
          AI 사회자
        </p>
        <p
          className={`mt-1 text-[12px] leading-5 ${noto.className}`}
          style={{ color: C.text200 }}
        >
          아빠, 발언권이 주어졌습니다. 기대하는 점을 먼저 이야기해 주세요.
        </p>
      </div>
      <Panel>
        <p
          className={`mb-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${noto.className}`}
          style={{ color: C.text300 }}
        >
          참가자
        </p>
        <div className="flex flex-col gap-1.5">
          {participants.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-[13px] border px-3 py-2"
              style={{
                borderColor: p.speaking ? C.primary : C.border,
                background: p.speaking ? C.chipBg : C.surface,
                boxShadow: p.speaking ? `0 0 0 1.5px ${C.primary}` : "none",
              }}
            >
              <div className="flex items-center gap-1.5">
                {p.host ? <Chip variant="host">방장</Chip> : null}
                {p.speaking ? (
                  <span className="text-[12px]">🎙</span>
                ) : p.queue ? (
                  <span
                    className={`text-[10px] ${noto.className}`}
                    style={{ color: C.text300 }}
                  >
                    대기
                  </span>
                ) : null}
                <span
                  className={`text-[13px] font-semibold ${ibm.className}`}
                  style={{ color: p.speaking ? C.chipText : C.text100 }}
                >
                  {p.name}
                </span>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{ background: C.chipBg, color: C.chipText }}
              >
                벌점 {p.score}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Btn variant="primary">발언 요청</Btn>
          <Btn variant="ghost">규칙 보기</Btn>
        </div>
      </Panel>
    </PhoneFrame>
  );
}

function ResultScreen() {
  return (
    <PhoneFrame label="04 결과보기">
      <Rail active={3} />
      <div
        className="rounded-[20px] border p-4"
        style={{ borderColor: C.heroAccentBorder, background: C.heroAccentBg }}
      >
        <p
          className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${noto.className}`}
          style={{ color: C.accent }}
        >
          토론 결과
        </p>
        <h3
          className={`mt-2 text-[18px] font-bold leading-snug ${ibm.className}`}
          style={{ color: C.text100 }}
        >
          예산 합의에 한 걸음 가까워졌습니다
        </h3>
        <p
          className={`mt-1.5 text-[12px] ${noto.className}`}
          style={{ color: C.text200 }}
        >
          40분 · 4명 · 총 24회 발언
        </p>
      </div>
      <Panel>
        <p
          className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${noto.className}`}
          style={{ color: C.text300 }}
        >
          합의된 점
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Chip variant="green">숙소 예산 60만원 이하</Chip>
          <Chip variant="green">식비 하루 5만원</Chip>
          <Chip variant="green">3박 4일 일정</Chip>
        </div>
      </Panel>
      <Panel>
        <p
          className={`mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] ${noto.className}`}
          style={{ color: C.text300 }}
        >
          미결 사항
        </p>
        <div className="flex flex-wrap gap-1.5">
          <Chip>교통비 분담 방식</Chip>
          <Chip>여행지 최종 결정</Chip>
        </div>
      </Panel>
      <Panel>
        <p
          className={`mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] ${noto.className}`}
          style={{ color: C.text300 }}
        >
          참가자 하이라이트
        </p>
        <div className="flex flex-col gap-2">
          {[
            { name: "엄마", note: "숙소 예산 제안 주도" },
            { name: "아빠", note: "교통비 현실적 수치 제시" },
            { name: "나", note: "합리적 중재안 제안" },
            { name: "동생", note: "여행지 후보 공유" },
          ].map((p) => (
            <div
              key={p.name}
              className="flex items-center gap-2.5 rounded-[13px] border px-3 py-2"
              style={{ borderColor: C.border }}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white ${ibm.className}`}
                style={{ background: C.primary }}
              >
                {p.name[0]}
              </div>
              <div>
                <p
                  className={`text-[13px] font-semibold ${ibm.className}`}
                  style={{ color: C.text100 }}
                >
                  {p.name}
                </p>
                <p
                  className={`text-[11px] ${noto.className}`}
                  style={{ color: C.text300 }}
                >
                  {p.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Btn variant="secondary" fullWidth>
        공유하기
      </Btn>
    </PhoneFrame>
  );
}

// ─── Design System Sections ───────────────────────────────────────────────────

function ColorSystem() {
  const swatches = [
    { name: "Background", token: "--bg", hex: C.bg, dark: false },
    { name: "Surface", token: "--surface", hex: C.surface, dark: false },
    { name: "Primary", token: "--primary", hex: C.primary, dark: true },
    { name: "Primary Dark", token: "--primary-dark", hex: C.primaryDark, dark: true },
    { name: "Accent", token: "--accent", hex: C.accent, dark: true },
    { name: "Accent Dark", token: "--accent-dark", hex: C.accentDark, dark: true },
    { name: "Text 100", token: "--text-100", hex: C.text100, dark: true },
    { name: "Text 200", token: "--text-200", hex: C.text200, dark: true },
    { name: "Text 300", token: "--text-300", hex: C.text300, dark: true },
    { name: "Border", token: "--border", hex: C.border, dark: false },
    { name: "Chip BG", token: "--chip-bg", hex: C.chipBg, dark: false },
    { name: "Chip Text", token: "--chip-text", hex: C.chipText, dark: true },
    { name: "Host BG", token: "--host-bg", hex: C.hostBg, dark: false },
    { name: "Host Text", token: "--host-text", hex: C.hostText, dark: true },
    { name: "Rail BG", token: "--rail-bg", hex: C.railBg, dark: false },
    { name: "Hero BG", token: "--hero-bg", hex: C.heroAccentBg, dark: false },
  ];
  return (
    <section>
      <SectionHeader tag="색상 시스템" title="Color Tokens" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {swatches.map((s) => (
          <div key={s.token} className="flex flex-col gap-1.5">
            <div
              className="h-14 rounded-[16px] border"
              style={{ background: s.hex, borderColor: C.border }}
            />
            <div>
              <p
                className={`text-[11px] font-semibold ${noto.className}`}
                style={{ color: C.text100 }}
              >
                {s.name}
              </p>
              <p
                className={`font-mono text-[10px] ${noto.className}`}
                style={{ color: C.text300 }}
              >
                {s.hex}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TypographyScale() {
  const scale = [
    {
      label: "Display",
      spec: "IBM Plex Sans KR 700 · 32px · leading-tight",
      cls: `${ibm.className} text-[32px] font-bold leading-tight`,
      sample: "우리 가족 여행 예산을 어떻게 정할까?",
    },
    {
      label: "H1",
      spec: "IBM Plex Sans KR 600 · 22px",
      cls: `${ibm.className} text-[22px] font-semibold`,
      sample: "토론방에 오신 걸 환영합니다",
    },
    {
      label: "H2",
      spec: "IBM Plex Sans KR 600 · 18px",
      cls: `${ibm.className} text-[18px] font-semibold`,
      sample: "참가자 목록",
    },
    {
      label: "Body Large",
      spec: "Noto Sans KR 500 · 15px · leading-7",
      cls: `${noto.className} text-[15px] font-medium leading-7`,
      sample: "현재 소주제: 기대하는 점과 걱정되는 점을 각자 이야기해 주세요.",
    },
    {
      label: "Body",
      spec: "Noto Sans KR 400 · 14px · leading-7",
      cls: `${noto.className} text-[14px] leading-7`,
      sample: "발언 요청 버튼을 눌러 발언 순서를 기다려 주세요.",
    },
    {
      label: "Caption",
      spec: "Noto Sans KR 500 · 12px · uppercase · tracking-[0.18em]",
      cls: `${noto.className} text-[12px] font-semibold uppercase tracking-[0.18em]`,
      sample: "메인 주제",
    },
    {
      label: "Label",
      spec: "Noto Sans KR 600 · 11px · uppercase · tracking-[0.22em]",
      cls: `${noto.className} text-[11px] font-semibold uppercase tracking-[0.22em]`,
      sample: "참가자 · 벌점 0",
    },
  ];
  return (
    <section>
      <SectionHeader tag="타이포그래피" title="Typography Scale" />
      <div className="flex flex-col gap-4">
        {scale.map((s) => (
          <div
            key={s.label}
            className="grid gap-3 rounded-[20px] border px-5 py-4 sm:grid-cols-[140px_1fr]"
            style={{ borderColor: C.border }}
          >
            <div>
              <p
                className={`text-[12px] font-semibold ${ibm.className}`}
                style={{ color: C.text100 }}
              >
                {s.label}
              </p>
              <p
                className={`mt-0.5 text-[10px] leading-4 ${noto.className}`}
                style={{ color: C.text300 }}
              >
                {s.spec}
              </p>
            </div>
            <p className={s.cls} style={{ color: C.text100 }}>
              {s.sample}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ComponentGuide() {
  return (
    <section>
      <SectionHeader tag="컴포넌트" title="UI Components" />
      <div className="flex flex-col gap-4">

        {/* Progress Rail */}
        <div
          className="rounded-[22px] border px-5 py-5"
          style={{ borderColor: C.border, background: C.surface }}
        >
          <p
            className={`mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] ${noto.className}`}
            style={{ color: C.text300 }}
          >
            Progress Rail — 4가지 활성 상태
          </p>
          <div className="flex flex-col gap-3 sm:max-w-sm">
            {([0, 1, 2, 3] as const).map((i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className={`w-16 shrink-0 text-[11px] ${noto.className}`}
                  style={{ color: C.text300 }}
                >
                  {["홈", "대기실", "토론방", "결과보기"][i]}
                </span>
                <div className="flex-1">
                  <Rail active={i} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div
          className="rounded-[22px] border px-5 py-5"
          style={{ borderColor: C.border, background: C.surface }}
        >
          <p
            className={`mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] ${noto.className}`}
            style={{ color: C.text300 }}
          >
            Buttons — 상태별 스타일
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col items-center gap-1.5">
              <Btn variant="primary">방 만들기</Btn>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Primary
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Btn variant="secondary">참가하기</Btn>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Secondary
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Btn variant="ghost">규칙 보기</Btn>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Ghost
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Btn variant="primary" disabled>
                토론 시작
              </Btn>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Disabled
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Btn variant="primary" small>
                발언 요청
              </Btn>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Small Primary
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Btn variant="ghost" small>
                사회자 보기
              </Btn>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Small Ghost
              </span>
            </div>
          </div>
          <div
            className="mt-4 rounded-[14px] px-4 py-3 text-[12px] leading-6"
            style={{ background: C.railBg, color: C.text200 }}
          >
            <span className={`font-semibold ${ibm.className}`}>인터랙션 패턴: </span>
            hover → <code>-translate-y-0.5</code> · active → <code>translate-y-[2px] shadow-[0_4px_0_...]</code>
          </div>
        </div>

        {/* Chips & Badges */}
        <div
          className="rounded-[22px] border px-5 py-5"
          style={{ borderColor: C.border, background: C.surface }}
        >
          <p
            className={`mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] ${noto.className}`}
            style={{ color: C.text300 }}
          >
            Chips & Badges
          </p>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <Chip variant="host">방장</Chip>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Host
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Chip>벌점 2</Chip>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Penalty
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Chip>지금 발언자 아빠</Chip>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Speaker
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Chip variant="accent">4명 참여 중</Chip>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Count
              </span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Chip variant="green">숙소 예산 합의</Chip>
              <span className={`text-[10px] ${noto.className}`} style={{ color: C.text300 }}>
                Agreement
              </span>
            </div>
          </div>
        </div>

        {/* Input Fields */}
        <div
          className="rounded-[22px] border px-5 py-5"
          style={{ borderColor: C.border, background: C.surface }}
        >
          <p
            className={`mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] ${noto.className}`}
            style={{ color: C.text300 }}
          >
            Input Fields
          </p>
          <div className="flex flex-col gap-3 sm:max-w-sm">
            <FieldMock label="기본 상태" placeholder="토론 주제를 입력하세요" />
            <div>
              <p
                className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.text300 }}
              >
                포커스 상태
              </p>
              <div
                className="w-full rounded-[13px] border px-3 py-2.5 text-[13px]"
                style={{
                  borderColor: C.accent,
                  background: "#FFFDF9",
                  color: C.text100,
                  boxShadow: `0 0 0 3px ${C.hostBg}`,
                }}
              >
                우리 가족 여행 예산
              </div>
            </div>
            <div>
              <p
                className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: C.text300 }}
              >
                에러 상태
              </p>
              <div
                className="w-full rounded-[13px] border px-3 py-2.5 text-[13px]"
                style={{
                  borderColor: "#E5334A",
                  background: "#FFF5F7",
                  color: C.text100,
                }}
              >
                AB1
              </div>
              <p
                className={`mt-1 text-[11px] ${noto.className}`}
                style={{ color: "#C4213A" }}
              >
                방 코드는 6자리여야 합니다.
              </p>
            </div>
            <FieldMock label="코드 입력 (tracking)" value="GHK391" placeholder="ABC123" center />
          </div>
        </div>
      </div>
    </section>
  );
}

function SpacingSystem() {
  const sizes = [4, 8, 12, 16, 20, 24, 32, 40, 48];
  return (
    <section>
      <SectionHeader tag="스페이싱" title="Spacing System" />
      <div
        className="rounded-[22px] border px-5 py-5"
        style={{ borderColor: C.border, background: C.surface }}
      >
        <div className="flex flex-wrap items-end gap-4">
          {sizes.map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div
                className="rounded-[4px]"
                style={{ width: s, height: s, background: C.primary }}
              />
              <span
                className={`text-[10px] font-semibold ${noto.className}`}
                style={{ color: C.text300 }}
              >
                {s}
              </span>
            </div>
          ))}
        </div>
        <div
          className={`mt-4 text-[12px] leading-6 ${noto.className}`}
          style={{ color: C.text200 }}
        >
          기본 단위: 4px · 카드 내부 패딩: 16px(모바일) / 20px(태블릿~) · 카드 간격: 12px · 섹션 간격: 24px
        </div>
      </div>
    </section>
  );
}

function DevNotes() {
  const notes = [
    {
      title: "globals.css 업데이트",
      body: `--background: ${C.bg};\n--foreground: ${C.text100};\n--primary: ${C.primary};\n--accent: ${C.accent};`,
      mono: true,
    },
    {
      title: "폰트 로딩 (layout.tsx)",
      body: `import { IBM_Plex_Sans_KR, Noto_Sans_KR } from "next/font/google";\nconst ibm = IBM_Plex_Sans_KR({ subsets: ["latin"], weight: ["400","500","600","700"] });\nconst noto = Noto_Sans_KR({ subsets: ["latin"], weight: ["400","500","700"] });`,
      mono: true,
    },
    {
      title: "버튼 인터랙션 패턴",
      body: `className="rounded-full bg-[${C.primary}] text-white font-medium shadow-[0_1px_3px_rgba(74,90,232,0.28)] hover:brightness-110 active:brightness-95 transition"`,
      mono: true,
    },
    {
      title: "진행바 상태 분기",
      body: "active: bg-[#4A5AE8] text-white\ncomplete: bg-[#EEF0FF] text-[#4A5AE8]\nidle: bg-transparent text-[#A1A1AA]",
      mono: true,
    },
    {
      title: "현재 발언자 강조",
      body: `border: 1.5px solid ${C.primary}\nbackground: ${C.chipBg}\nbox-shadow: 0 0 0 1.5px ${C.primary}`,
      mono: true,
    },
    {
      title: "카드 그림자 시스템",
      body: "패널 카드: shadow-[0_12px_32px_rgba(28,25,23,0.07)]\n히어로 카드: 그림자 없음, 배경색으로 구분\n중첩 카드 (참가자 행): shadow-none, border만 사용",
      mono: false,
    },
  ];
  return (
    <section>
      <SectionHeader tag="개발자 전달 노트" title="Developer Handoff" />
      <div className="grid gap-3 sm:grid-cols-2">
        {notes.map((n) => (
          <div
            key={n.title}
            className="rounded-[20px] border px-4 py-4"
            style={{ borderColor: C.border, background: C.surface }}
          >
            <p
              className={`mb-2 text-[12px] font-semibold ${ibm.className}`}
              style={{ color: C.text100 }}
            >
              {n.title}
            </p>
            <pre
              className="overflow-x-auto rounded-[10px] px-3 py-2.5 text-[11px] leading-5 whitespace-pre-wrap"
              style={{ background: C.bg, color: C.text200, fontFamily: "IBM Plex Mono, monospace" }}
            >
              {n.body}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function DesignFinal() {
  return (
    <main
      className="min-h-screen px-4 py-8 sm:px-6 sm:py-10"
      style={{
        background: `radial-gradient(circle at top, rgba(74,90,232,0.06), transparent 36%), linear-gradient(180deg, ${C.bg} 0%, #F2F3F9 100%)`,
        color: C.text100,
      }}
    >
      <div className="mx-auto max-w-7xl">

        {/* ── Page Header ─────────────────────────────────────── */}
        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${noto.className}`}
              style={{ color: C.text300 }}
            >
              Debate Room · Design System
            </p>
            <h1
              className={`mt-2 text-4xl font-bold leading-tight sm:text-5xl ${ibm.className}`}
              style={{ color: C.text100 }}
            >
              최종 디자인 가이드
            </h1>
            <p
              className={`mt-3 max-w-2xl text-sm leading-7 sm:text-base ${noto.className}`}
              style={{ color: C.text200 }}
            >
              1안 Bright Ledger의 구조를 유지하면서 색감을 더 따뜻하고 밝게 다듬은
              &ldquo;Warm Ledger&rdquo; 방향입니다.
              코랄을 앰버-오렌지로, 네이비 텍스트를 따뜻한 근접-흑으로 교체했습니다.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Chip variant="host">Warm Ledger</Chip>
              <Chip>IBM Plex Sans KR + Noto Sans KR</Chip>
              <Chip variant="green">모바일 우선</Chip>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/design-lab"
              className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:opacity-80 ${ibm.className}`}
              style={{ borderColor: C.border, background: C.surface, color: C.text100 }}
            >
              컨셉 탐색 3안 보기 →
            </Link>
            <Link
              href="/"
              className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition hover:opacity-80 ${noto.className}`}
              style={{ borderColor: C.border, background: C.surface, color: C.text200 }}
            >
              메인으로
            </Link>
          </div>
        </div>

        {/* ── Design System Sections ───────────────────────────── */}
        <div className="flex flex-col gap-12">
          <ColorSystem />
          <TypographyScale />
          <ComponentGuide />

          {/* ── Screen Mockups ──────────────────────────────────── */}
          <section>
            <SectionHeader tag="화면 시안" title="Screen Mockups" />
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-4">
              <HomeScreen />
              <WaitingScreen />
              <DebateScreen />
              <ResultScreen />
            </div>
          </section>

          <SpacingSystem />
          <DevNotes />
        </div>

        {/* ── Footer ──────────────────────────────────────────── */}
        <div
          className={`mt-12 border-t pt-6 text-center text-[12px] ${noto.className}`}
          style={{ borderColor: C.border, color: C.text300 }}
        >
          Debate Room · Warm Ledger Design System · 2026
        </div>
      </div>
    </main>
  );
}
