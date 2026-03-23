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
    <section className="rounded-[24px] bg-[#efe7d7] p-1.5 shadow-[0_10px_28px_rgba(20,33,61,0.06)]">
      <div className="grid grid-cols-4 gap-1">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;

          return (
            <div
              key={step.id}
              className={`min-w-0 rounded-full px-2 py-2 text-center text-[11px] font-semibold tracking-[-0.01em] sm:px-3 sm:py-2.5 sm:text-sm ${
                isActive
                  ? "bg-[#1f3c88] text-white"
                  : isComplete
                    ? "bg-[#fff3cf] text-[#7c5b00]"
                    : "bg-transparent text-[#8a7756]"
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
