# OneRide — MoveNYC

Smart transportation decision platform for NYC commuters. Compare **Uber**, **Lyft**, **Empower**, and **NYC taxi** estimates in one progressive web app.

> Google Maps tells you how to get somewhere. MoveNYC tells you the smartest way to get there.

## MVP scope (this boilerplate)

- React + Vite progressive web app
- Mapbox map centered on NYC metro
- Address search geofenced to NYC and surrounding areas
- Side-by-side ride comparison dashboard
- **Agent mode** — describe a trip in plain English; OpenAI parses intent (heuristic fallback if the key fails), then opens the same map + pricing page as manual booking, sorted to your preference
- One-tap deep links to open Uber, Lyft, Empower, or taxi booking apps
- Hardcoded/estimated pricing until live provider APIs are wired up

## Tech stack

| Layer | Choice |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS |
| Maps | Mapbox GL JS + Geocoding API |
| PWA | `vite-plugin-pwa` |
| Pricing | Boilerplate estimates in `src/services/rideProviders.js` |

## Getting started

```bash
npm install
cp .env.example .env   # if .env is missing
npm run dev
```

Open the local URL shown in your terminal (usually `http://localhost:5173`).

### Environment variables

| Variable | Description |
| --- | --- |
| `VITE_MAPBOX_TOKEN` | Mapbox public token for map + geocoding |
| `OPENAI_API_KEY` | Server-side OpenAI key for Agent mode (`/api/parse-trip`). Optional — without it, the heuristic parser is used. |

For Vercel deploys, set `OPENAI_API_KEY` in the project’s environment variables (not as a `VITE_` var).

## Project structure

```
api/
├── parse-trip.js     # Vercel serverless: OpenAI trip intent
└── _lib/             # Shared OpenAI parser (also used by Vite dev)
src/
├── components/       # UI: map, search, comparison cards
├── constants/        # NYC bounds, provider metadata
├── hooks/            # useRideComparison state hook
├── services/         # geocoding, pricing, deep links, trip intent, current location
└── utils/            # formatting helpers
```

## Provider integration notes

Live price APIs require partner credentials:

- **Uber** — [Uber Developer Platform](https://developer.uber.com/)
- **Lyft** — [Lyft Developer](https://developer.lyft.com/)
- **Empower** — No public pricing API; partner integration TBD
- **NYC Taxi** — TLC public trip data + meter formula (or Curb dispatch deep links)

Replace the estimate logic in `fetchRideQuotes()` when credentials are available.

## Scripts

```bash
npm run dev      # local development
npm run build    # production build
npm run preview  # preview production build
```

## Demo narrative

People already know how to get from Point A to Point B. The harder problem is knowing which option makes the most sense. OneRide compares transportation options and helps users make smarter decisions that save time and money every day.
