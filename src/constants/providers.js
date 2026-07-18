export const RIDE_PROVIDERS = {
  uber: {
    id: 'uber',
    name: 'Uber',
    brandColor: '#000000',
    accentColor: '#ffffff',
  },
  lyft: {
    id: 'lyft',
    name: 'Lyft',
    brandColor: '#ff00bf',
    accentColor: '#ffffff',
  },
  empower: {
    id: 'empower',
    name: 'Empower',
    brandColor: '#6d28d9',
    accentColor: '#ffffff',
  },
  nycTaxi: {
    id: 'nycTaxi',
    name: 'NYC Taxi',
    brandColor: '#facc15',
    accentColor: '#1e293b',
  },
};

/**
 * Pseudo-provider for users driving their own car. Not part of
 * RIDE_PROVIDERS so provider API loops and deep links skip it.
 */
export const PERSONAL_CAR = {
  id: 'ownCar',
  name: 'Your car',
  brandColor: '#0f172a',
  accentColor: '#ffffff',
};

export const SORT_MODES = {
  cheapest: 'Lowest cost',
  fastest: 'Fastest arrival',
  bestValue: 'Best value',
};
