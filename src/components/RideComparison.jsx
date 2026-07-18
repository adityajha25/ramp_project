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
    <div className="rounded-xl border border-accent/40 bg-accent-light px-3 py-2 text-sm font-medium text-accent-dark">
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
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-gray-200 bg-white" />
        ))}
      </div>
    );
  }

  if (!pickup || !dropoff) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-4">
        <p className="text-sm font-medium text-gray-700">Comparison dashboard</p>
        <p className="mt-2 text-sm text-gray-400">
          Set a pickup and dropoff to compare Uber, Lyft, Empower, and NYC taxi side by side.
        </p>
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <p className="text-sm text-gray-500">No quotes yet. Tap refresh to load estimates.</p>
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

      <p className="text-xs text-gray-400">
        Prices are simulated from distance, traffic, and market variance — live provider pricing
        and booking APIs are coming in the next iteration.
      </p>
    </div>
  );
}
