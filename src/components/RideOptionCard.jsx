import { useState } from 'react';
import ProviderLogo from './ProviderLogo.jsx';
import { formatAveragePrice, formatDuration } from '../utils/formatters.js';

export default function RideOptionCard({
  quote,
  isRecommended,
  isSelected,
  onSelect,
  selectedTierId,
  onSelectTier,
}) {
  const [showTiers, setShowTiers] = useState(false);

  const tiers = quote.tiers ?? [];
  const activeTier = tiers.find((tier) => tier.id === selectedTierId) ?? tiers[0] ?? null;
  const priceLow = activeTier?.priceLow ?? quote.priceLow;
  const priceHigh = activeTier?.priceHigh ?? quote.priceHigh;
  const etaMinutes = activeTier?.etaMinutes ?? quote.etaMinutes;
  const hasPremiumTiers = tiers.length > 1;

  return (
    <div
      className={`w-full rounded-2xl border bg-white shadow-card transition ${
        isSelected ? 'border-brand ring-2 ring-brand/30' : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full p-4 text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProviderLogo providerId={quote.providerId} size={40} />

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-ink">
                  {activeTier && activeTier.name !== quote.providerName
                    ? activeTier.name
                    : quote.providerName}
                </h3>
                {isRecommended ? (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Best pick
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm text-gray-500">
                {formatDuration(etaMinutes)} trip · est.
                {quote.surgeMultiplier > 1 ? (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    {quote.surgeMultiplier.toFixed(1)}x surge
                  </span>
                ) : null}
              </p>
              {quote.note ? <p className="mt-0.5 text-xs text-gray-400">{quote.note}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <p className="text-base font-semibold text-ink">
              {formatAveragePrice(priceLow, priceHigh)}
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

      {hasPremiumTiers ? (
        <div className="border-t border-gray-100 px-4 pb-3 pt-2">
          <button
            type="button"
            onClick={() => setShowTiers((value) => !value)}
            className="flex w-full items-center justify-between text-xs font-semibold text-gray-500 transition hover:text-brand"
          >
            <span>{showTiers ? 'Hide ride options' : `${tiers.length} ride options`}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`h-3.5 w-3.5 transition-transform ${showTiers ? 'rotate-180' : ''}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {showTiers ? (
            <ul className="mt-2 space-y-1.5">
              {tiers.map((tier) => {
                const isActiveTier = tier.id === (activeTier?.id ?? tiers[0].id);
                return (
                  <li key={tier.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTier(tier.id);
                        onSelect();
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition ${
                        isActiveTier
                          ? 'border-brand bg-brand-light/40'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-ink">{tier.name}</span>
                        <span className="block truncate text-xs text-gray-400">{tier.note}</span>
                      </span>
                      <span className="ml-3 shrink-0 text-right">
                        <span className="block text-sm font-semibold text-ink">
                          {formatAveragePrice(tier.priceLow, tier.priceHigh)}
                        </span>
                        <span className="block text-xs text-gray-400">
                          {formatDuration(tier.etaMinutes ?? quote.etaMinutes)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
