/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: 'rgb(var(--void) / <alpha-value>)',
        canvas: 'rgb(var(--canvas) / <alpha-value>)',
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          hair: 'var(--surface-hair)',
          'hair-strong': 'var(--surface-hair-strong)',
        },
        paper: {
          DEFAULT: 'rgb(var(--paper) / <alpha-value>)',
          dim: 'rgb(var(--paper-dim) / <alpha-value>)',
          faint: 'rgb(var(--paper-faint) / <alpha-value>)',
        },
        ink: 'rgb(var(--paper) / <alpha-value>)',
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          dark: 'rgb(var(--brand-dark) / <alpha-value>)',
          light: 'rgb(var(--brand-light) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          dark: 'rgb(var(--accent-dark) / <alpha-value>)',
          light: 'rgb(var(--accent-light) / <alpha-value>)',
        },
        signal: {
          DEFAULT: 'rgb(var(--signal) / <alpha-value>)',
          dark: 'rgb(var(--signal-dark) / <alpha-value>)',
          light: 'rgb(var(--signal-light) / <alpha-value>)',
          ink: 'rgb(var(--signal-ink) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          light: 'rgb(var(--danger-light) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        lift: 'var(--shadow-lift)',
        glow: 'var(--shadow-glow)',
        'glow-sm': 'var(--shadow-glow-sm)',
        hairline: 'var(--shadow-hairline)',
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
