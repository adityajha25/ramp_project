import { useTheme } from '../context/ThemeContext.jsx';

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      className="press flex h-9 w-9 items-center justify-center rounded-full border border-surface-hair bg-surface/60 text-paper-dim transition hover:border-surface-hair-strong hover:text-paper"
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1.5M12 19.5V21M4.22 4.22l1.06 1.06M18.72 18.72l1.06 1.06M3 12h1.5M19.5 12H21M4.22 19.78l1.06-1.06M18.72 5.28l1.06-1.06M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 14.25A8.25 8.25 0 1 1 9.75 2.75a6.75 6.75 0 0 0 11.25 11.5Z"
          />
        </svg>
      )}
    </button>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-surface-hair bg-canvas/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 lg:px-6">
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

        <div className="flex items-center gap-2">
          <div className="hidden rounded-full border border-surface-hair bg-surface/60 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest text-paper-dim sm:inline-flex">
            NYC metro only
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
