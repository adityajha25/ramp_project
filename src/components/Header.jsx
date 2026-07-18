export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-hair bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full bg-signal" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
          </span>
          <span className="text-wordmark text-2xl text-paper">
            <span className="text-brand">One</span>
            <span className="text-accent">Ride</span>
          </span>
        </div>

        <div className="rounded-full border border-surface-hair bg-surface/60 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-paper-dim">
          NYC metro only
        </div>
      </div>
    </header>
  );
}
