import RideOptionCard from './RideOptionCard.jsx';
import { formatCurrency } from '../utils/formatters.js';

function SavingsBanner({ quotes, recommendedQuote }) {
  if (!recommendedQuote || quotes.length < 2) {
    return null;
  }

  const averageOf = (quote) => (quote.priceLow + quote.priceHigh) / 2;
  const mostExpensive = [...quotes].sort((a, b) => averageOf(b) - averageOf(a))[0];
  const savings = averageOf(mostExpensive) - averageOf(recommendedQuote);

  if (savings <= 0) {
    return null;
  }

  return (
    <div className="animate-rise-in flex items-center gap-2 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 font-sans text-sm font-medium tabular-nums text-accent">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0-6 6m6-6 6 6" />
      </svg>
      Save up to {formatCurrency(savings)} vs {mostExpensive.providerName}.
    </div>
  );
}

export default function RideComparison({
  quotes,
  recommendedQuote,
  pickup,
  dropoff,
  isLoading,
  selectedProviderId,
  onSelectQuote,
  selectedTiers,
  onSelectTier,
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }

  if (!pickup || !dropoff) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-hair-strong bg-surface/40 p-4">
        <p className="text-sm font-medium text-paper">Comparison dashboard</p>
        <p className="mt-2 text-sm text-paper-faint">
          Set a pickup and dropoff to compare Uber, Lyft, Empower, and NYC taxi side by side.
        </p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-4">
        <p className="text-sm text-paper-dim">No quotes yet. Tap refresh to load estimates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SavingsBanner quotes={quotes} recommendedQuote={recommendedQuote} />

      <div className="space-y-3">
        {quotes.map((quote, index) => (
          <RideOptionCard
            key={quote.providerId}
            quote={quote}
            isRecommended={index === 0}
            isSelected={quote.providerId === selectedProviderId}
            onSelect={() => onSelectQuote(quote.providerId)}
            selectedTierId={selectedTiers?.[quote.providerId]}
            onSelectTier={(tierId) => onSelectTier(quote.providerId, tierId)}
          />
        ))}
      </div>

      <p className="text-xs text-paper-faint">
        Prices are simulated from distance, traffic, and market variance — live provider pricing
        and booking APIs are coming in the next iteration.
      </p>
    </div>
  );
}
