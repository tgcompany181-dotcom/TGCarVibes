import type { Category } from './types';

/** Current fleet supplied by the owner (README "Current fleet"). */
export const FLEET_SEED: {
  model: string;
  year: number;
  category: Category;
  seats: number;
  bags: string;
  weeklyRate: number;
  photoUrl?: string;
}[] = [
  { model: 'Honda Civic', year: 2011, category: 'Sedan', seats: 5, bags: '3', weeklyRate: 200, photoUrl: '/images/civic-front.jpg' },
  { model: 'Toyota Camry', year: 2016, category: 'Sedan', seats: 5, bags: '3', weeklyRate: 265 },
  { model: 'Toyota HiAce', year: 2010, category: 'Van', seats: 3, bags: 'Cargo', weeklyRate: 330 },
  { model: 'Honda CR-V', year: 2016, category: 'SUV', seats: 5, bags: '3', weeklyRate: 300 },
  { model: 'Toyota Camry', year: 2017, category: 'Sedan', seats: 5, bags: '3', weeklyRate: 270 },
  { model: 'Honda Civic', year: 2015, category: 'Sedan', seats: 5, bags: '3', weeklyRate: 250 },
  { model: 'Toyota Camry', year: 2013, category: 'Sedan', seats: 5, bags: '3', weeklyRate: 230 },
  { model: 'Toyota Corolla', year: 2013, category: 'Sedan', seats: 5, bags: '2', weeklyRate: 220 },
  { model: 'Honda Civic', year: 2015, category: 'Sedan', seats: 5, bags: '3', weeklyRate: 250 },
  { model: 'Toyota Corolla Hatchback', year: 2015, category: 'Hatch', seats: 5, bags: '2', weeklyRate: 250 },
  { model: 'Toyota Aurion', year: 2014, category: 'Sedan', seats: 5, bags: '3', weeklyRate: 245 },
];
