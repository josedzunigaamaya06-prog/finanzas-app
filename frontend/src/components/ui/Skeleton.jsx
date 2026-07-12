export function Sk({ className = '', rounded = 'rounded-lg' }) {
  return <div className={`skeleton ${rounded} ${className}`} />;
}

export function SkStatCard() {
  return (
    <div className="card p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2.5">
          <Sk className="h-2 w-14" />
          <Sk className="h-7 w-28" />
        </div>
        <Sk className="w-9 h-9 flex-shrink-0 !rounded-xl" />
      </div>
    </div>
  );
}

export function SkTableRow({ cols = 5 }) {
  const widths = ['flex-1 max-w-[180px]', 'w-20', 'w-16', 'w-12', 'w-20', 'w-14'];
  return (
    <div className="flex gap-4 items-center px-4 py-3 border-b border-slate-50">
      {Array.from({ length: cols }).map((_, i) => (
        <Sk key={i} className={`h-3.5 ${widths[i] || 'w-16'}`} />
      ))}
    </div>
  );
}

export function SkMobileRow() {
  return (
    <div className="card p-4 flex items-center gap-3">
      <Sk className="w-9 h-9 flex-shrink-0 !rounded-xl" />
      <div className="flex-1 space-y-2 min-w-0">
        <Sk className="h-3.5 w-40" />
        <Sk className="h-3 w-24" />
      </div>
      <Sk className="h-4 w-20 flex-shrink-0" />
    </div>
  );
}

export function SkCard({ className = '' }) {
  return (
    <div className={`card p-5 space-y-4 ${className}`}>
      <div className="flex items-start gap-3">
        <Sk className="w-10 h-10 flex-shrink-0 !rounded-xl" />
        <div className="flex-1 space-y-2">
          <Sk className="h-4 w-36" />
          <Sk className="h-3 w-24" />
        </div>
      </div>
      <Sk className="h-2 w-full !rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <Sk className="h-8 !rounded-xl" />
        <Sk className="h-8 !rounded-xl" />
      </div>
    </div>
  );
}
