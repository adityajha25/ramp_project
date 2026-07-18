import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import LocationSearch from '../components/LocationSearch.jsx';
import { DEMO_ROUTES } from '../constants/nyc.js';

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
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-light text-accent-dark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
            />
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold text-ink">Agent mode</p>
          <p className="mt-1 text-sm text-gray-500">
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
          className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
        />

        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? 'Planning your trip…' : 'Go'}
        </button>
      </form>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Try an example</p>
        <div className="flex flex-wrap gap-2">
          {AGENT_EXAMPLES.map((example) => (
            <button
              key={example}
              type="button"
              disabled={isLoading}
              onClick={() => setPrompt(example)}
              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-xs font-medium text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-50"
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
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-16 pt-10 sm:pt-14">
        <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          Where are you headed?
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Compare Uber, Lyft, Empower, and NYC Taxi — then book the best ride right here, without
          switching apps.
        </p>

        <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-card sm:p-6">
          <div className="mb-5 flex rounded-full bg-gray-100 p-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setError?.(null);
                }}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-white text-ink shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
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
                <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              ) : null}

              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Popular routes
                </p>
                <div className="flex flex-wrap gap-2">
                  {DEMO_ROUTES.map((route) => (
                    <button
                      key={route.id}
                      type="button"
                      onClick={() => handleDemoRoute(route)}
                      disabled={isLoading}
                      className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-50"
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

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <span>Book</span>
          <span className="font-semibold text-gray-500">Uber</span>
          <span>·</span>
          <span className="font-semibold text-gray-500">Lyft</span>
          <span>·</span>
          <span className="font-semibold text-gray-500">Empower</span>
          <span>·</span>
          <span className="font-semibold text-gray-500">NYC Taxi</span>
          <span>— all in one app</span>
        </div>
      </main>
    </div>
  );
}
