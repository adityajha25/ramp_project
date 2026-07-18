import { formatCurrency, formatDuration } from '../utils/formatters.js';

export default function RideOptionCard({ quote, isRecommended, isSelected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-card transition ${
        isSelected
          ? 'border-brand ring-2 ring-brand/30'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: quote.brandColor, color: quote.accentColor }}
          >
            {quote.providerName.charAt(0)}
          </span>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-ink">{quote.providerName}</h3>
              {isRecommended ? (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Best pick
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              {formatDuration(quote.etaMinutes)} trip · est.
              {quote.surgeMultiplier > 1 ? (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  {quote.surgeMultiplier.toFixed(1)}x surge
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <p className="text-base font-semibold text-ink">
            {formatCurrency(quote.priceLow)} – {formatCurrency(quote.priceHigh)}
          </p>
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
              isSelected ? 'border-brand bg-brand' : 'border-gray-300 bg-white'
            }`}
          >
            {isSelected ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" className="h-3 w-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : null}
          </span>
        </div>
      </div>
    </button>
  );
}
