import RideOptionCard from './RideOptionCard.jsx';
import { formatCurrency } from '../utils/formatters.js';

function SavingsBanner({ quotes, recommendedQuote }) {
  if (!recommendedQuote || quotes.length < 2) {
    return null;
  }

  const mostExpensive = [...quotes].sort((a, b) => b.priceHigh - a.priceHigh)[0];
  const savings = mostExpensive.priceHigh - recommendedQuote.priceLow;

  if (savings <= 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
      Potential savings up to {formatCurrency(savings)} vs {mostExpensive.providerName}.
    </div>
  );
}

export default function RideComparison({
  quotes,
  recommendedQuote,
  pickup,
  dropoff,
  isLoading,
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-sm text-slate-400">Fetching ride estimates…</p>
      </div>
    );
  }

  if (!pickup || !dropoff) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-4">
        <p className="text-sm font-medium text-slate-300">Comparison dashboard</p>
        <p className="mt-2 text-sm text-slate-500">
          Set a pickup and dropoff to compare Uber, Lyft, Empower, and NYC taxi side by side.
        </p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-sm text-slate-400">No quotes yet. Tap compare to load estimates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-sm font-medium text-slate-300">Recommended</p>
        <p className="mt-1 text-lg font-semibold text-white">
          {recommendedQuote.providerName}
        </p>
        <p className="text-sm text-slate-400">
          {formatCurrency(recommendedQuote.priceLow)} – {formatCurrency(recommendedQuote.priceHigh)}
        </p>
      </div>

      <SavingsBanner quotes={quotes} recommendedQuote={recommendedQuote} />

      <div className="space-y-3">
        {quotes.map((quote, index) => (
          <RideOptionCard
            key={quote.providerId}
            quote={quote}
            pickup={pickup}
            dropoff={dropoff}
            isRecommended={index === 0}
          />
        ))}
      </div>

      <p className="text-xs text-slate-500">
        Prices are simulated from distance, traffic, and random market variance. Tap compare again
        to refresh estimates.
      </p>
    </div>
  );
}
