interface PaginationControlsProps {
  currentSetIndex: number;
  totalSets: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function PaginationControls({
  currentSetIndex,
  totalSets,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  const isFirst = currentSetIndex === 0;
  const isLast = currentSetIndex >= totalSets - 1;

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-violet-100">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirst}
        className="bubble-text rounded-xl border border-violet-200 px-5 py-2 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Previous
      </button>
      <p className="bubble-strong text-lg font-bold">
        Set
        {" "}
        {currentSetIndex + 1}
        {" "}
        of
        {" "}
        {totalSets}
      </p>
      <button
        type="button"
        onClick={onNext}
        disabled={isLast}
        className="bubble-text rounded-xl border border-violet-200 px-5 py-2 text-lg font-bold disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}
