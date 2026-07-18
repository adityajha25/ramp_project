export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 lg:px-6">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand">MoveNYC</p>
          <h1 className="text-xl font-semibold text-white">OneRide</h1>
          <p className="text-sm text-slate-400">
            The smartest way to compare rides in NYC.
          </p>
        </div>

        <div className="hidden rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 sm:block">
          NYC metro only
        </div>
      </div>
    </header>
  );
}
