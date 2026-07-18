/**
 * Inline SVG brand marks for ride providers and MTA transit.
 * Simple vector approximations — no external assets required.
 */

export function UberLogo({ size = 40, className = '' }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-label="Uber"
    >
      <rect width="40" height="40" rx="20" fill="#000" />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fill="#fff"
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        Uber
      </text>
    </svg>
  );
}

export function LyftLogo({ size = 40, className = '' }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-label="Lyft"
    >
      <rect width="40" height="40" rx="20" fill="#FF00BF" />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fill="#fff"
        fontSize="11"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        lyft
      </text>
    </svg>
  );
}

export function EmpowerLogo({ size = 40, className = '' }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-label="Empower"
    >
      <rect width="40" height="40" rx="20" fill="#6d28d9" />
      <text
        x="20"
        y="26"
        textAnchor="middle"
        fill="#fff"
        fontSize="16"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        E
      </text>
    </svg>
  );
}

export function NycTaxiLogo({ size = 40, className = '' }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={className}
      aria-label="NYC Taxi"
    >
      <rect width="40" height="40" rx="20" fill="#facc15" />
      <rect x="6" y="18" width="28" height="8" rx="1" fill="#1e293b" opacity="0.15" />
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fill="#1e293b"
        fontSize="9"
        fontWeight="800"
        fontFamily="system-ui, sans-serif"
      >
        TAXI
      </text>
    </svg>
  );
}

export function OwnCarLogo({ size = 40, className = '' }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} className={className} aria-label="Your car">
      <rect width="40" height="40" rx="20" fill="#0f172a" />
      <path
        d="M10 22l2-6h16l2 6M10 22h20M10 22a2 2 0 0 0-2 2v2h2m18-4a2 2 0 0 1 2 2v2h-2m-14 0a1.5 1.5 0 1 1-3 0m15 0a1.5 1.5 0 1 1-3 0"
        fill="none"
        stroke="#fff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(0, 2)"
      />
    </svg>
  );
}

/** MTA-style route bullet in official line color. */
export function MtaLineBullet({ lineName, color, textColor = '#fff', size = 20 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{
        backgroundColor: color,
        color: textColor,
        minWidth: size,
        height: size,
        fontSize: size * 0.42,
        padding: '0 4px',
      }}
      aria-hidden
    >
      {lineName}
    </span>
  );
}

/** Generic MTA subway circle (when line color unknown). */
export function MtaSubwayLogo({ size = 24, className = '' }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-label="Subway">
      <circle cx="12" cy="12" r="11" fill="#0039A6" />
      <circle cx="12" cy="12" r="7" fill="none" stroke="#fff" strokeWidth="1.5" />
      <text x="12" y="15" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700">
        MTA
      </text>
    </svg>
  );
}

export default function ProviderLogo({ providerId, size = 40, className = '' }) {
  switch (providerId) {
    case 'uber':
      return <UberLogo size={size} className={className} />;
    case 'lyft':
      return <LyftLogo size={size} className={className} />;
    case 'empower':
      return <EmpowerLogo size={size} className={className} />;
    case 'nycTaxi':
      return <NycTaxiLogo size={size} className={className} />;
    case 'ownCar':
      return <OwnCarLogo size={size} className={className} />;
    default:
      return (
        <span
          className={`inline-flex items-center justify-center rounded-full bg-gray-800 text-white ${className}`}
          style={{ width: size, height: size, fontSize: size * 0.35 }}
        >
          ?
        </span>
      );
  }
}
