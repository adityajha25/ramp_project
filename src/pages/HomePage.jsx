import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import LocationSearch from '../components/LocationSearch.jsx';
import { DEMO_ROUTES } from '../constants/nyc.js';

const TABS = [
  { id: 'manual', label: 'Book a ride' },
  { id: 'agent', label: 'Agent mode' },
];

function AgentModePanel() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gray-300/80 bg-white/40 px-6 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-accent-dark">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
          />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-ink">
          Agent mode
          <span className="ml-2 rounded-full bg-brand-light px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand">
            Coming soon
          </span>
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">
          Describe your trip in plain English — &ldquo;get me to JFK by 6pm, cheapest option&rdquo; — and
          the OneRide agent will compare every service and book the best one for you.
        </p>
      </div>
      <textarea
        disabled
        rows={2}
        placeholder="Where do you want to go? (disabled)"
        className="w-full max-w-md cursor-not-allowed resize-none rounded-xl border border-gray-200 bg-white/70 px-3 py-2.5 text-sm text-gray-400 placeholder:text-gray-300"
      />
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
    isLoading,
    error,
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

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gray-50">
      {/* Soft color field behind the glass surfaces */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute -right-16 top-40 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <Header />

        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pb-16 pt-10 sm:pt-14">
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Where are you headed?
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Compare Uber, Lyft, Empower, and NYC Taxi — then book the best ride right here, without
            switching apps.
          </p>

          <div className="glass mt-6 rounded-3xl p-5 sm:p-6">
            <div className="mb-5 flex rounded-full border border-white/60 bg-white/40 p-1 backdrop-blur-sm">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeTab === tab.id
                      ? 'bg-white text-ink shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.id === 'agent' ? (
                    <span className="ml-1.5 align-middle text-[10px] font-bold uppercase text-accent-dark">
                      soon
                    </span>
                  ) : null}
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
                  <p className="mt-3 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-sm text-red-600">
                    {error}
                  </p>
                ) : null}

                <div className="mt-5 border-t border-white/60 pt-4">
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
                        className="rounded-full border border-white/70 bg-white/50 px-3 py-1.5 text-xs font-medium text-gray-600 backdrop-blur-sm transition hover:border-brand hover:text-brand disabled:opacity-50"
                      >
                        {route.label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <AgentModePanel />
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
    </div>
  );
}
