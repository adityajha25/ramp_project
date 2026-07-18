import LocationSearch from './components/LocationSearch.jsx';
import MapView from './components/MapView.jsx';
import RideComparison from './components/RideComparison.jsx';
import Header from './components/Header.jsx';
import { useRideComparison } from './hooks/useRideComparison.js';
import { DEMO_ROUTES } from './constants/nyc.js';
import { SORT_MODES } from './constants/providers.js';

export default function App() {
  const {
    pickup,
    dropoff,
    setPickup,
    setDropoff,
    quotes,
    recommendedQuote,
    sortMode,
    setSortMode,
    compareRoute,
    loadDemoRoute,
    isLoading,
    error,
  } = useRideComparison();

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      <Header />

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6 lg:px-6 lg:py-6">
        <section className="flex min-h-[320px] flex-col gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/20">
            <div className="mb-3">
              <p className="text-sm font-medium text-slate-300">Where are you going?</p>
              <p className="text-xs text-slate-500">
                Compare Uber, Lyft, Empower, and NYC taxi estimates in one view.
              </p>
            </div>

            <LocationSearch
              pickup={pickup}
              dropoff={dropoff}
              onPickupChange={setPickup}
              onDropoffChange={setDropoff}
              onCompare={compareRoute}
              isLoading={isLoading}
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {DEMO_ROUTES.map((route) => (
                <button
                  key={route.id}
                  type="button"
                  onClick={() => loadDemoRoute(route)}
                  className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 transition hover:border-brand hover:text-white"
                >
                  {route.label}
                </button>
              ))}
            </div>

            {error ? (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}
          </div>

          <MapView
            pickup={pickup}
            dropoff={dropoff}
            onPickupChange={setPickup}
            onDropoffChange={setDropoff}
          />
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="mb-3 text-sm font-medium text-slate-300">Rank by</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
              {Object.entries(SORT_MODES).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSortMode(mode)}
                  className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                    sortMode === mode
                      ? 'bg-brand text-white'
                      : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <RideComparison
            quotes={quotes}
            recommendedQuote={recommendedQuote}
            pickup={pickup}
            dropoff={dropoff}
            isLoading={isLoading}
          />
        </aside>
      </main>
    </div>
  );
}
