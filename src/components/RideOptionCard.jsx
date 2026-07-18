import { openProviderBooking } from '../services/deepLinks.js';
import { formatCurrency, formatDuration } from '../utils/formatters.js';

export default function RideOptionCard({ quote, pickup, dropoff, isRecommended }) {
  const handleBook = () => {
    openProviderBooking(quote.providerId, { pickup, dropoff });
  };

  return (
    <article
      className={`rounded-2xl border p-4 transition ${
        isRecommended
          ? 'border-brand bg-brand/10 shadow-lg shadow-brand/10'
          : 'border-slate-800 bg-slate-900/70'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: quote.brandColor }}
            />
            <h3 className="text-base font-semibold text-white">{quote.providerName}</h3>
            {isRecommended ? (
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                Best pick
              </span>
            ) : null}
          </div>

          <p className="mt-2 text-sm text-slate-400">
            ETA {formatDuration(quote.etaMinutes)} · Estimate
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-semibold text-white">
            {formatCurrency(quote.priceLow)} – {formatCurrency(quote.priceHigh)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleBook}
        className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition"
        style={{
          backgroundColor: quote.brandColor,
          color: quote.accentColor,
        }}
      >
        Open {quote.providerName} to book
      </button>
    </article>
  );
}
