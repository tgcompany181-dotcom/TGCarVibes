/**
 * Questions shown to customers when they send a booking request from the website.
 * Add, remove or reorder entries here — the form, validation and admin view follow automatically.
 */
export type BookingQuestion =
  | { id: string; label: string; type: 'choice'; options: string[]; required: boolean }
  | { id: string; label: string; type: 'text'; placeholder?: string; required: boolean };

export const BOOKING_QUESTIONS: BookingQuestion[] = [
  { id: 'licence', label: 'Which driver licence do you have?', type: 'choice', options: ['Australian', 'International'], required: true },
  { id: 'licenceClass', label: 'Is your licence Provisional (P) or Full?', type: 'choice', options: ['Provisional (P)', 'Full'], required: true },
  { id: 'age21', label: 'Are you 21 or over?', type: 'choice', options: ['Yes', 'No'], required: true },
  { id: 'rideshare', label: 'Will you use the car for Uber, rideshare or delivery work?', type: 'choice', options: ['Yes', 'No'], required: true },
  { id: 'suburb', label: 'Which suburb do you live in?', type: 'text', placeholder: 'e.g. Bankstown', required: true },
  { id: 'interstate', label: 'Will you drive the car outside Sydney or interstate?', type: 'choice', options: ['Yes', 'No'], required: true },
];

/** ID documents the customer uploads with a request. At least MIN_DOCUMENTS different kinds are required. */
export const DOCUMENT_KINDS = [
  { id: 'licence', label: 'Driver licence or passport' },
  { id: 'medicare', label: 'Medicare card' },
  { id: 'bank', label: 'Bank card', hint: 'Cover the middle numbers — we only need your name and the last 4 digits.' },
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number]['id'];
export const MIN_DOCUMENTS = 2;
export const MAX_DOCUMENT_BYTES = 4 * 1024 * 1024;
export const DOCUMENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};
