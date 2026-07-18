import { useState } from 'react';
import ProviderLogo from './ProviderLogo.jsx';
import { formatAveragePrice, formatDuration } from '../utils/formatters.js';

/**
 * Splits a formatted "$24.50" string so the cents can be set smaller/lighter,
 * like a menu or receipt price.
 */
function SplitPrice({ low, high, className = '', centsClassName = '' }) {
  const formatted = formatAveragePrice(low, high);
  const whole = formatted.slice(0, -3);
  const cents = formatted.slice(-3);

  return (
    <span className={className}>
      {whole}
      <span className={centsClassName}>{cents}</span>
    </span>
  );
}

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
      className={`w-full rounded-2xl border transition-all duration-300 ease-expo ${
        isSelected
          ? 'border-signal/60 bg-surface shadow-glow'
          : 'border-surface-hair bg-surface shadow-card hover:border-surface-hair-strong'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full p-4 text-left">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ProviderLogo providerId={quote.providerId} size={40} />

            <div className="border-l divider-dashed pl-3">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-base font-semibold text-paper">
                  {activeTier && activeTier.name !== quote.providerName
                    ? activeTier.name
                    : quote.providerName}
                </h3>
                {isRecommended ? (
                  <span className="animate-stamp inline-block -rotate-2 rounded-sm bg-signal px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-signal-ink shadow-glow-sm">
                    Best pick
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm text-paper-faint">
                {formatDuration(etaMinutes)} trip · est.
                {quote.surgeMultiplier > 1 ? (
                  <span className="ml-2 rounded-full bg-[#ffcc4d]/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-[#ffcc4d]">
                    {quote.surgeMultiplier.toFixed(1)}x surge
                  </span>
                ) : null}
              </p>
              {quote.note ? <p className="mt-0.5 text-xs text-paper-faint">{quote.note}</p> : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <SplitPrice
              low={priceLow}
              high={priceHigh}
              className="font-display text-lg font-semibold text-paper"
              centsClassName="text-sm font-normal text-paper-dim"
            />
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                isSelected ? 'border-signal bg-signal' : 'border-surface-hair-strong bg-transparent'
              }`}
            >
              {isSelected ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="#1B1006" strokeWidth="3.5" className="h-3 w-3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              ) : null}
            </span>
          </div>
        </div>
      </button>

      {hasPremiumTiers ? (
        <div className="divider-dashed border-t px-4 pb-3 pt-2">
          <button
            type="button"
            onClick={() => setShowTiers((value) => !value)}
            className="flex w-full items-center justify-between text-xs font-semibold text-paper-faint transition hover:text-signal"
          >
            <span>{showTiers ? 'Hide ride options' : `${tiers.length} ride options`}</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={`h-3.5 w-3.5 transition-transform duration-300 ease-expo ${showTiers ? 'rotate-180' : ''}`}
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
                          ? 'border-signal/40 bg-signal/10'
                          : 'border-surface-hair hover:border-surface-hair-strong'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-paper">{tier.name}</span>
                        <span className="block truncate text-xs text-paper-faint">{tier.note}</span>
                      </span>
                      <span className="ml-3 shrink-0 text-right">
                        <SplitPrice
                          low={tier.priceLow}
                          high={tier.priceHigh}
                          className="block font-display text-sm font-semibold text-paper"
                          centsClassName="text-xs font-normal text-paper-dim"
                        />
                        <span className="block text-xs text-paper-faint">
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
