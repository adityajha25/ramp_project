import { openProviderBooking } from '../services/deepLinks.js';
import { formatCurrency, formatDuration } from '../utils/formatters.js';

/**
 * Mock in-app booking flow. Once live provider APIs are connected, the
 * "requesting" state will place a real ride request instead of a timer.
 */
export default function BookingSheet({ status, quote, pickup, dropoff, onDone }) {
  if (!status || !quote) {
    return null;
  }

  const isRequesting = status === 'requesting';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl">
        {isRequesting ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand" />
            <p className="mt-5 text-base font-semibold text-ink">
              Requesting your {quote.providerName} ride…
            </p>
            <p className="mt-1 text-sm text-gray-500">Confirming price and driver availability</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center pb-2 pt-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-accent-dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
              <p className="mt-4 text-lg font-bold text-ink">Ride booked!</p>
              <p className="mt-1 text-sm text-gray-500">
                Your {quote.providerName} is on the way — about{' '}
                {formatDuration(Math.max(Math.round(quote.etaMinutes / 3), 2))} to pickup.
              </p>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Ride</span>
                <span className="font-semibold text-ink">{quote.providerName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Fare</span>
                <span className="font-semibold text-ink">
                  {formatCurrency(quote.priceLow)} – {formatCurrency(quote.priceHigh)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-6 text-sm">
                <span className="shrink-0 text-gray-500">From</span>
                <span className="truncate font-medium text-ink">{pickup?.label}</span>
              </div>
              <div className="flex items-center justify-between gap-6 text-sm">
                <span className="shrink-0 text-gray-500">To</span>
                <span className="truncate font-medium text-ink">{dropoff?.label}</span>
              </div>
            </div>

            <p className="mt-3 rounded-xl bg-brand-light/60 px-3 py-2 text-xs text-brand-dark">
              Demo booking — live {quote.providerName} dispatch will be connected once partner API
              credentials are in place.
            </p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={onDone}
                className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => openProviderBooking(quote.providerId, { pickup, dropoff })}
                className="w-full rounded-xl px-4 py-2 text-xs font-medium text-gray-400 transition hover:text-gray-600"
              >
                Or finish in the {quote.providerName} app
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
