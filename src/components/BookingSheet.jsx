import { openProviderBooking } from '../services/deepLinks.js';
import { formatAveragePrice, formatDuration } from '../utils/formatters.js';

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-void/70 backdrop-blur-sm sm:items-center">
      <div className="glass-strong animate-rise-in w-full max-w-md rounded-t-3xl p-6 sm:rounded-3xl">
        {isRequesting ? (
          <div className="flex flex-col items-center py-8 text-center">
            <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-surface-hair-strong border-t-signal" />
            <p className="mt-5 font-display text-base font-semibold text-paper">
              Requesting your {quote.providerName} ride…
            </p>
            <p className="mt-1 text-sm text-paper-dim">Confirming price and driver availability</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center pb-2 pt-2 text-center">
              <span className="animate-pop-in flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </span>
              <p className="mt-4 font-display text-lg font-bold text-paper">Ride booked!</p>
              <p className="mt-1 text-sm text-paper-dim">
                Your {quote.providerName} is on the way — about{' '}
                {formatDuration(Math.max(Math.round(quote.etaMinutes / 3), 2))} to pickup.
              </p>
            </div>

            <div className="surface-card mt-4 space-y-3 rounded-2xl p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-paper-faint">Ride</span>
                <span className="font-semibold text-paper">{quote.providerName}</span>
              </div>
              <div className="divider-dashed flex items-center justify-between border-t pt-3 text-sm">
                <span className="text-paper-faint">Fare</span>
                <span className="font-mono font-semibold text-paper">
                  {formatAveragePrice(quote.priceLow, quote.priceHigh)}
                </span>
              </div>
              <div className="divider-dashed flex items-center justify-between gap-6 border-t pt-3 text-sm">
                <span className="shrink-0 text-paper-faint">From</span>
                <span className="truncate font-medium text-paper">{pickup?.label}</span>
              </div>
              <div className="divider-dashed flex items-center justify-between gap-6 border-t pt-3 text-sm">
                <span className="shrink-0 text-paper-faint">To</span>
                <span className="truncate font-medium text-paper">{dropoff?.label}</span>
              </div>
            </div>

            <p className="mt-3 rounded-xl border border-signal/25 bg-signal/10 px-3 py-2 text-xs text-paper-dim">
              Demo booking — live {quote.providerName} dispatch will be connected once partner API
              credentials are in place.
            </p>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={onDone}
                className="press w-full rounded-xl bg-signal px-4 py-3 text-sm font-semibold text-signal-ink shadow-glow-sm transition hover:bg-[#ff8a5c]"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => openProviderBooking(quote.providerId, { pickup, dropoff })}
                className="w-full rounded-xl px-4 py-2 text-xs font-medium text-paper-faint transition hover:text-paper-dim"
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
