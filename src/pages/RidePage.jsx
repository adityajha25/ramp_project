import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapView from '../components/MapView.jsx';
import RideComparison from '../components/RideComparison.jsx';
import { SORT_MODES } from '../constants/providers.js';

function TripSummary({ pickup, dropoff }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-card">
      <div className="flex gap-3">
        <div className="flex flex-col items-center pt-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent" />
          <span className="my-1 w-px flex-1 bg-gray-300" />
          <span className="h-2.5 w-2.5 rounded-sm bg-brand" />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Pickup</p>
            <p className="truncate text-sm font-medium text-ink">{pickup?.label || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Dropoff</p>
            <p className="truncate text-sm font-medium text-ink">{dropoff?.label || '—'}</p>
          </div>
        </div>
        <Link
          to="/"
          className="self-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:border-brand hover:text-brand"
        >
          Edit
        </Link>
      </div>
    </div>
  );
}

export default function RidePage({ ride }) {
  const navigate = useNavigate();
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
    isLoading,
    error,
  } = ride;

  // No trip set (e.g. direct URL visit) — send the user back to the home page.
  useEffect(() => {
    if (!pickup || !dropoff) {
      navigate('/', { replace: true });
    }
  }, [pickup, dropoff, navigate]);

  if (!pickup || !dropoff) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Back to home"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-brand hover:text-brand"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <span className="text-lg font-extrabold tracking-tight">
          <span className="text-brand">One</span>
          <span className="text-accent">Ride</span>
        </span>
        <span className="ml-auto text-sm font-medium text-gray-500">Choose your ride</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="h-[40vh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <MapView
            pickup={pickup}
            dropoff={dropoff}
            onPickupChange={setPickup}
            onDropoffChange={setDropoff}
            className="h-full w-full"
          />
        </div>

        <aside className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto border-t border-gray-200 bg-gray-50 p-4 lg:order-1 lg:w-[400px] lg:flex-none lg:border-r lg:border-t-0">
          <TripSummary pickup={pickup} dropoff={dropoff} />

          <div className="flex gap-2">
            {Object.entries(SORT_MODES).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortMode(mode)}
                className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold transition ${
                  sortMode === mode
                    ? 'bg-ink text-white'
                    : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <RideComparison
            quotes={quotes}
            recommendedQuote={recommendedQuote}
            pickup={pickup}
            dropoff={dropoff}
            isLoading={isLoading}
          />

          <button
            type="button"
            onClick={compareRoute}
            disabled={isLoading}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-brand hover:text-brand disabled:opacity-50"
          >
            {isLoading ? 'Refreshing…' : 'Refresh estimates'}
          </button>
        </aside>
      </div>
    </div>
  );
}
