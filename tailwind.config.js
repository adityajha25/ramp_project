/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Night canvas — cool ink scale used for backgrounds/surfaces.
        void: '#07080C',
        canvas: '#0B0D14',
        surface: {
          DEFAULT: '#141826',
          raised: '#1B2032',
          hair: 'rgba(247,243,234,0.09)',
          'hair-strong': 'rgba(247,243,234,0.18)',
        },
        // Warm paper scale — used for text on the dark canvas.
        paper: {
          DEFAULT: '#F6F2E9',
          dim: '#ACA695',
          faint: '#6E695C',
        },
        // "One" — elevated cobalt. Wordmark + pickup/dropoff wayfinding.
        brand: {
          DEFAULT: '#5B8CFF',
          dark: '#3D67E0',
          light: '#26305A',
        },
        // "Ride" — elevated jade. Wordmark + success states.
        accent: {
          DEFAULT: '#2FE6A8',
          dark: '#17C48D',
          light: '#193B34',
        },
        // Meter signal — the one warm, high-energy color. Primary CTA only.
        signal: {
          DEFAULT: '#FF7A45',
          dark: '#E85D2A',
          light: '#4A2A1B',
          ink: '#1B1006',
        },
        danger: {
          DEFAULT: '#FF5C6C',
          light: '#3A1620',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.35), 0 16px 40px -12px rgba(0,0,0,0.6)',
        lift: '0 2px 4px rgba(0,0,0,0.4), 0 24px 48px -16px rgba(0,0,0,0.65)',
        glow: '0 0 0 1px rgba(255,122,69,0.45), 0 8px 28px -4px rgba(255,122,69,0.4)',
        'glow-sm': '0 0 0 1px rgba(255,122,69,0.35), 0 4px 14px -2px rgba(255,122,69,0.35)',
        hairline: 'inset 0 1px 0 rgba(247,243,234,0.08)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(.34,1.56,.64,1)',
        expo: 'cubic-bezier(.16,1,.3,1)',
      },
      keyframes: {
        'rise-in': {
          '0%': { opacity: 0, transform: 'translateY(14px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(.9)' },
          '60%': { opacity: 1, transform: 'scale(1.03)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 0.55, transform: 'scale(1)' },
          '50%': { opacity: 1, transform: 'scale(1.06)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-300% 0' },
          '100%': { backgroundPosition: '300% 0' },
        },
        stamp: {
          '0%': { opacity: 0, transform: 'rotate(-2deg) scale(1.4)' },
          '100%': { opacity: 1, transform: 'rotate(-2deg) scale(1)' },
        },
        'grain-drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0)' },
          '50%': { transform: 'translate3d(-2%,-1%,0)' },
        },
      },
      animation: {
        'rise-in': 'rise-in .6s cubic-bezier(.16,1,.3,1) both',
        'rise-in-1': 'rise-in .6s cubic-bezier(.16,1,.3,1) .06s both',
        'rise-in-2': 'rise-in .6s cubic-bezier(.16,1,.3,1) .12s both',
        'rise-in-3': 'rise-in .6s cubic-bezier(.16,1,.3,1) .18s both',
        'pop-in': 'pop-in .5s cubic-bezier(.34,1.56,.64,1) both',
        'pulse-glow': 'pulse-glow 2.6s ease-in-out infinite',
        shimmer: 'shimmer 2.4s linear infinite',
        stamp: 'stamp .5s cubic-bezier(.34,1.56,.64,1) both',
        'grain-drift': 'grain-drift 9s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
