import { RIDE_PROVIDERS } from '../constants/providers.js';

/**
 * Procedurally generated driver personas for the simulated booking demo.
 * Deterministic pools keep it instant and offline; this could be swapped for
 * an OpenAI-generated persona via the existing /api plugin later.
 */

const FIRST_NAMES = [
  'Maria', 'Ahmed', 'Wei', 'Jose', 'Fatima', 'Dmitri', 'Priya', 'Marcus',
  'Elena', 'Mohammed', 'Grace', 'Carlos', 'Aisha', 'Viktor', 'Rosa', 'Samuel',
  'Yuki', 'Omar', 'Nadia', 'Devon',
];

const LAST_INITIALS = ['A', 'B', 'C', 'D', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W'];

const RIDESHARE_CARS = [
  { make: 'Toyota', model: 'Camry' },
  { make: 'Honda', model: 'Accord' },
  { make: 'Tesla', model: 'Model 3' },
  { make: 'Toyota', model: 'Highlander' },
  { make: 'Honda', model: 'CR-V' },
  { make: 'Hyundai', model: 'Sonata' },
  { make: 'Nissan', model: 'Rogue' },
];

const TAXI_CARS = [
  { make: 'Toyota', model: 'Camry' },
  { make: 'Ford', model: 'Escape Hybrid' },
  { make: 'Nissan', model: 'Altima' },
];

const CAR_COLORS = ['Black', 'White', 'Silver', 'Gray', 'Dark Blue'];

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function randomTlcPlate() {
  return `T${Math.floor(100000 + Math.random() * 900000)}C`;
}

function randomMedallion() {
  const letter = pick(['A', 'B', 'E', 'F', 'G', 'H', 'J', 'K']);
  return `${Math.floor(1 + Math.random() * 9)}${letter}${Math.floor(10 + Math.random() * 90)}`;
}

export function generateDriver(providerId) {
  const isTaxi = providerId === RIDE_PROVIDERS.nycTaxi?.id;
  const car = isTaxi ? pick(TAXI_CARS) : pick(RIDESHARE_CARS);

  return {
    firstName: pick(FIRST_NAMES),
    lastInitial: pick(LAST_INITIALS),
    rating: (4.7 + Math.random() * 0.29).toFixed(2),
    trips: Math.floor(600 + Math.random() * 14000),
    car: {
      ...car,
      color: isTaxi ? 'Yellow' : pick(CAR_COLORS),
    },
    plate: isTaxi ? randomMedallion() : randomTlcPlate(),
  };
}
