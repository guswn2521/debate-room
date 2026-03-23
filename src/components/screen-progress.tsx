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
    <section className="rounded-[28px] border border-[#e8decb] bg-white/92 px-4 py-4 shadow-[0_16px_42px_rgba(20,33,61,0.08)] backdrop-blur sm:px-5">
      <div className="flex items-center gap-2 overflow-x-auto">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;

          return (
            <div key={step.id} className="flex min-w-0 flex-1 items-center gap-2">
              <div
                className={`flex min-w-0 flex-1 items-center gap-2 rounded-full border px-3 py-2 ${
                  isActive
                    ? "border-[#1f3c88] bg-[#1f3c88] text-white"
                    : isComplete
                      ? "border-[#f7b500] bg-[#fff3cf] text-[#7c5b00]"
                      : "border-[#d9cfbc] bg-[#fffdf8] text-[#8a7756]"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isActive
                      ? "bg-[#f7b500] text-[#1f3c88]"
                      : isComplete
                        ? "bg-[#f7b500] text-[#1f3c88]"
                        : "bg-[#efe7d7] text-[#8a7756]"
                  }`}
                >
                  {index + 1}
                </span>
                <span className="truncate text-sm font-semibold sm:text-base">{step.label}</span>
              </div>
              {index < steps.length - 1 ? (
                <div
                  className={`hidden h-[2px] flex-1 sm:block ${
                    index < currentIndex ? "bg-[#f7b500]" : "bg-[#e5dccb]"
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
