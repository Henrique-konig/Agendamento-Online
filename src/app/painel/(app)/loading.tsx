export default function Loading() {
  return (
    <div aria-busy aria-label="Carregando" className="animate-pulse space-y-6">
      <div className="space-y-3">
        <div className="h-8 w-56 rounded-lg bg-ink-200/70" />
        <div className="h-4 w-80 max-w-full rounded bg-ink-100" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white ring-1 ring-ink-200/60" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-white ring-1 ring-ink-200/60" />
    </div>
  );
}
