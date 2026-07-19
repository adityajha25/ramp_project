import { useState } from 'react';
import ProviderLogo, { MtaLineBullet, MtaSubwayLogo } from './ProviderLogo.jsx';
import { formatAveragePrice, formatCurrency, formatDuration, formatTime } from '../utils/formatters.js';

const MTA_PAYMENT_NOTE =
  'Pay $2.90 with OMNY — tap phone/card at the turnstile, or buy at a station vending machine.';

function LiveHeadway({ minutes }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-accent-dark">
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3" aria-hidden>
        <circle cx="8" cy="8" r="3" opacity="0.9" />
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.5" />
      </svg>
      Runs every ~{minutes} min · live
    </span>
  );
}

function LegIcon({ leg }) {
  if (leg.mode === 'walk') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-raised text-paper-dim">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3.5 w-3.5">
          <circle cx="12" cy="5" r="2" />
          <path strokeLinecap="round" d="M12 7.5 10 13l-2.5 6M12 7.5l2 4 3 1.5" />
        </svg>
      </span>
    );
  }

  if (leg.mode === 'ride') {
    return <ProviderLogo providerId={leg.providerId} size={24} className="shrink-0" />;
  }

  const segment = leg.segments?.[0];
  if (segment) {
    return (
      <MtaLineBullet
        lineName={segment.lineName}
        color={segment.color}
        textColor={segment.textColor}
        size={24}
      />
    );
  }

  return <MtaSubwayLogo size={24} className="shrink-0" />;
}

function LegRow({ leg }) {
  let description;
  let detail;

  if (leg.mode === 'walk') {
    description = `Walk to ${leg.toLabel}`;
    detail = `${leg.miles} mi`;
  } else if (leg.mode === 'ride') {
    description = `${leg.providerName} to ${leg.toLabel}`;
    detail = formatAveragePrice(leg.costLow, leg.costHigh);
  } else {
    description = `${leg.fromLabel} → ${leg.toLabel}`;
    detail =
      leg.transfers > 0
        ? `${leg.transfers} transfer${leg.transfers > 1 ? 's' : ''} · ${formatCurrency(leg.costLow)}`
        : formatCurrency(leg.costLow);
  }

  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5"><LegIcon leg={leg} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-paper">{description}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-2 font-sans text-xs tabular-nums text-paper-faint">
          <span>{formatDuration(leg.minutes)}</span>
          {leg.mode === 'subway' && leg.headwayMinutes ? (
            <>
              <span>·</span>
              <LiveHeadway minutes={leg.headwayMinutes} />
            </>
          ) : (
            <>
              <span>·</span>
              <span>{detail}</span>
            </>
          )}
        </span>
      </span>
    </li>
  );
}

/**
 * Turn-by-turn steps with scheduled times, like Apple/Google transit.
 */
function buildDetailedSteps(itinerary) {
  const steps = [];
  let cursor = new Date(itinerary.departAt || Date.now());
  let showedMtaPayment = false;

  for (const leg of itinerary.legs) {
    if (leg.mode === 'walk') {
      const depart = new Date(cursor);
      cursor = new Date(cursor.getTime() + leg.minutes * 60 * 1000);
      steps.push({
        time: depart,
        title: `Walk to ${leg.toLabel}`,
        detail: `${leg.miles} mi · about ${formatDuration(leg.minutes)}`,
      });
    } else if (leg.mode === 'ride') {
      const depart = new Date(cursor);
      cursor = new Date(cursor.getTime() + leg.minutes * 60 * 1000);
      steps.push({
        time: depart,
        title: `Take ${leg.providerName} to ${leg.toLabel}`,
        detail: `About ${formatDuration(leg.minutes)} incl. pickup · ${formatAveragePrice(leg.costLow, leg.costHigh)}`,
        providerId: leg.providerId,
      });
    } else {
      leg.segments.forEach((segment, index) => {
        if (index > 0) {
          const transferAt = new Date(cursor);
          cursor = new Date(cursor.getTime() + 4 * 60 * 1000);
          steps.push({
            time: transferAt,
            title: `Transfer to the ${segment.lineName} train`,
            detail: `At ${segment.fromName} — follow signs to the ${segment.lineName} platform`,
            segment,
            isTransfer: true,
          });
        }

        const boardAt = new Date(cursor);
        cursor = new Date(cursor.getTime() + segment.minutes * 60 * 1000);

        steps.push({
          time: boardAt,
          title: `Board the ${segment.lineName} train at ${segment.fromName}`,
          detail: null,
          headwayMinutes: leg.headwayMinutes,
          segment,
          paymentNote: !showedMtaPayment ? MTA_PAYMENT_NOTE : null,
        });
        showedMtaPayment = true;

        steps.push({
          time: new Date(cursor),
          title: `Get off at ${segment.toName}`,
          detail: `${segment.stops} stop${segment.stops > 1 ? 's' : ''} · about ${formatDuration(segment.minutes)}`,
          segment,
        });
      });
    }
  }

  steps.push({ time: cursor, title: 'Arrive at your destination', detail: null });
  return steps;
}

function SplitPrice({ low, high }) {
  const formatted = formatAveragePrice(low, high);
  const whole = formatted.slice(0, -3);
  const cents = formatted.slice(-3);

  return (
    <p className="shrink-0 font-sans text-base font-semibold tabular-nums text-paper">
      {whole}
      <span className="text-sm font-normal text-paper-dim">{cents}</span>
    </p>
  );
}

function ItineraryCard({ itinerary, isSelected, onSelect }) {
  const [expanded, setExpanded] = useState(false);
  const steps = buildDetailedSteps(itinerary);

  const showSavings = itinerary.savingsVsDirect >= 1;
  const isFaster = itinerary.minutesVsDirect < 0;

  return (
    <article
      className={`rounded-2xl border transition-all duration-300 ease-expo ${
        isSelected
          ? 'border-signal/60 bg-surface shadow-glow'
          : 'border-surface-hair bg-surface shadow-card hover:border-surface-hair-strong'
      }`}
    >
      <button type="button" onClick={onSelect} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-display text-sm font-semibold text-paper">{itinerary.label}</h3>
              {showSavings ? (
                <span className="rounded-full bg-accent/15 px-2 py-0.5 font-sans text-[10px] font-bold tabular-nums uppercase tracking-wide text-accent">
                  Save {formatCurrency(itinerary.savingsVsDirect)}
                </span>
              ) : null}
              {isFaster ? (
                <span className="rounded-full bg-brand/15 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-brand">
                  Faster than driving
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-paper-faint">
              {formatDuration(itinerary.totalMinutes)}
              {itinerary.departAt ? ` · leave ${formatTime(itinerary.departAt)}` : ''}
              {itinerary.minutesVsDirect > 0
                ? ` · +${Math.round(itinerary.minutesVsDirect)} min vs direct ride`
                : ''}
            </p>
          </div>
          <SplitPrice low={itinerary.costLow} high={itinerary.costHigh} />
        </div>

        <ul className="mt-3 divider-dashed space-y-2.5 border-t pt-3">
          {itinerary.legs.map((leg, index) => (
            <LegRow key={index} leg={leg} />
          ))}
        </ul>
      </button>

      <div className="divider-dashed border-t px-4 pb-3 pt-2">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-between text-xs font-semibold text-paper-faint transition hover:text-signal"
        >
          <span>{expanded ? 'Hide directions' : 'Step-by-step directions'}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className={`h-3.5 w-3.5 transition-transform duration-300 ease-expo ${expanded ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {expanded ? (
          <ol className="mt-3 space-y-3">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="mt-0.5 w-12 shrink-0 text-right text-[11px] font-semibold tabular-nums text-paper-faint">
                  {step.time ? formatTime(step.time) : ''}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-paper">
                    {step.providerId ? (
                      <ProviderLogo providerId={step.providerId} size={18} />
                    ) : step.segment ? (
                      <MtaLineBullet
                        lineName={step.segment.lineName}
                        color={step.segment.color}
                        textColor={step.segment.textColor}
                        size={18}
                      />
                    ) : null}
                    <span>{step.title}</span>
                  </span>
                  {step.headwayMinutes ? (
                    <span className="mt-1 block">
                      <LiveHeadway minutes={step.headwayMinutes} />
                    </span>
                  ) : null}
                  {step.paymentNote ? (
                    <span className="mt-1 block text-xs text-paper-faint">{step.paymentNote}</span>
                  ) : null}
                  {step.detail ? (
                    <span className="mt-0.5 block font-sans text-xs tabular-nums text-paper-faint">{step.detail}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </article>
  );
}

export default function SmartRoutes({ itineraries, isLoading, selectedId, onSelect, pickup, dropoff }) {
  const hasTrip = Boolean(pickup && dropoff);

  if (!hasTrip) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 pt-1">
        <h2 className="font-display text-sm font-bold text-paper">Smart routes</h2>
        <span className="rounded-full bg-surface-raised px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-paper-faint">
          Subway + rides
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="skeleton h-28" />
          <div className="skeleton h-28" />
        </div>
      ) : !itineraries || itineraries.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-surface-hair-strong bg-surface/40 p-4">
          <p className="text-sm font-medium text-paper">No public transit routes yet</p>
          <p className="mt-1 text-xs text-paper-faint">
            Try a trip of at least one mile with subway stations nearby, or refresh estimates after
            setting pickup and dropoff.
          </p>
        </div>
      ) : (
        <>
          {itineraries.map((itinerary) => (
            <ItineraryCard
              key={itinerary.id}
              itinerary={itinerary}
              isSelected={itinerary.id === selectedId}
              onSelect={() => onSelect(itinerary)}
            />
          ))}

          <p className="text-xs text-paper-faint">
            Tap a route to see it on the map. Headways update for current time of day.
          </p>
        </>
      )}
    </section>
  );
}
