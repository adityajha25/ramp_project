import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import LocationSearch from '../components/LocationSearch.jsx';
import { DEMO_ROUTES } from '../constants/nyc.js';
import { RIDE_PROVIDERS } from '../constants/providers.js';

const TABS = [
  { id: 'manual', label: 'Book a ride' },
  { id: 'agent', label: 'Agent mode' },
];

const AGENT_EXAMPLES = [
  'get me to JFK by 6pm, cheapest option',
  'fastest ride to LaGuardia',
  'from Williamsburg to SoHo, best value',
];

function AgentModePanel({ onSubmit, isLoading, error }) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!prompt.trim() || isLoading) return;
    await onSubmit(prompt.trim());
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal/15 text-signal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
            />
          </svg>
        </div>
        <div>
          <p className="font-display text-base font-semibold text-paper">Agent mode</p>
          <p className="mt-1 text-sm text-paper-dim">
            Describe your trip in plain English — &ldquo;fastest ride to LaGuardia&rdquo; — and we&apos;ll
            open the map with your pickup, destination, and ranked prices.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={3}
          placeholder="Where do you want to go?"
          disabled={isLoading}
          className="w-full resize-none rounded-xl border border-surface-hair bg-surface/70 px-3 py-2.5 text-sm text-paper outline-none transition placeholder:text-paper-faint focus:border-signal/50 focus:bg-surface focus:ring-2 focus:ring-signal/30 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="press w-full rounded-xl bg-signal px-4 py-3 text-sm font-semibold text-signal-ink shadow-glow-sm transition hover:bg-[#ff8a5c] disabled:cursor-not-allowed disabled:bg-surface disabled:text-paper-faint disabled:shadow-none"
        >
          {isLoading ? 'Planning your trip…' : 'Go'}
        </button>
      </form>

      {error ? (
        <p className="rounded-xl border border-danger/40 bg-danger-light px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div>
        <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-paper-faint">
          Try an example
        </p>
        <div className="flex flex-wrap gap-2">
          {AGENT_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={isLoading}
              onClick={() => setPrompt(example)}
              className="rounded-full border border-surface-hair bg-surface/50 px-3 py-1.5 text-left text-xs font-medium text-paper-dim transition hover:border-signal/50 hover:text-signal disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage({ ride }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('manual');

  const {
    pickup,
    dropoff,
    setPickup,
    setDropoff,
    compareRoute,
    loadDemoRoute,
    runAgentTrip,
    isLoading,
    error,
    setError,
  } = ride;

  const handleSeePrices = async () => {
    const ok = await compareRoute();
    if (ok) {
      navigate('/ride');
    }
  };

  const handleDemoRoute = async (route) => {
    const ok = await loadDemoRoute(route);
    if (ok) {
      navigate('/ride');
    }
  };

  const handleAgentSubmit = async (prompt) => {
    const ok = await runAgentTrip(prompt);
    if (ok) {
      navigate('/ride');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <Header />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-16 pt-10 sm:pt-14">
        <h1 className="animate-rise-in font-display text-4xl font-medium leading-[1.05] tracking-tight text-paper sm:text-5xl">
          Where are you <em className="text-brand not-italic">headed</em>?
        </h1>
        <p className="animate-rise-in-1 mt-3 text-sm text-paper-dim">
          Compare Uber, Lyft, Empower, and NYC Taxi — then book the best ride right here, without
          switching apps.
        </p>

        <div className="glass-strong animate-rise-in-2 mt-7 rounded-[2rem] p-5 sm:p-6">
          <div className="mb-5 flex rounded-full border border-surface-hair bg-surface/60 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setError?.(null);
                }}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ease-expo ${
                  activeTab === tab.id
                    ? 'bg-signal text-signal-ink shadow-glow-sm'
                    : 'text-paper-dim hover:text-paper'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'manual' ? (
            <>
              <LocationSearch
                pickup={pickup}
                dropoff={dropoff}
                onPickupChange={setPickup}
                onDropoffChange={setDropoff}
                onCompare={handleSeePrices}
                isLoading={isLoading}
              />

              {error ? (
                <p className="mt-3 rounded-xl border border-danger/40 bg-danger-light px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              ) : null}

              <div className="mt-5 divider-dashed border-t pt-4">
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-paper-faint">
                  Popular routes
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_ROUTES.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => handleDemoRoute(route)}
                      disabled={isLoading}
                      className="rounded-full border border-surface-hair bg-surface/50 px-3 py-1.5 text-xs font-medium text-paper-dim transition hover:border-signal/50 hover:text-signal disabled:opacity-50"
                    >
                      {route.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <AgentModePanel onSubmit={handleAgentSubmit} isLoading={isLoading} error={error} />
          )}
        </div>

        <div className="animate-rise-in-3 mt-7 flex items-center justify-center gap-2.5 text-xs text-paper-faint">
          <span>Book</span>
          {Object.values(RIDE_PROVIDERS).map((provider) => (
            <span key={provider.id} className="inline-flex items-center gap-1.5 font-semibold text-paper-dim">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: provider.brandColor }}
              />
              {provider.name}
            </span>
          ))}
          <span>— all in one app</span>
        </div>
      </main>
    </div>
  );
}
