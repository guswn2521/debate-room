const steps = [
  { id: "home", label: "홈" },
  { id: "waiting", label: "대기실" },
  { id: "active", label: "토론방" },
  { id: "results", label: "결과보기" },
] as const;

type ScreenProgressProps = {
  current: (typeof steps)[number]["id"];
};

export function ScreenProgress({ current }: ScreenProgressProps) {
  const currentIndex = steps.findIndex((step) => step.id === current);

  return (
    <section className="rounded-[18px] bg-[#f0f0ef] p-1 shadow-[0_10px_28px_rgba(24,24,27,0.06)]">
      <div className="grid grid-cols-4 gap-1">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;

          return (
            <div
              key={step.id}
              className={`min-w-0 rounded-full px-2 py-2 text-center text-[11px] font-semibold tracking-[-0.01em] sm:px-3 sm:py-2.5 sm:text-sm ${
                isActive
                  ? "bg-[#4a5ae8] text-white"
                  : index < currentIndex
                    ? "bg-[#eef0ff] text-[#4a5ae8]"
                    : "bg-transparent text-[#a1a1aa]"
              }`}
            >
              <div className="whitespace-nowrap">{step.label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
