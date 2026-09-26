import type { CATEGORIES } from './config';

export type Category = (typeof CATEGORIES)[number];
export type CarStatus = 'available' | 'hire' | 'service';

/** All dates are ISO calendar dates ("YYYY-MM-DD") in Sydney time. */
export type ISODate = string;

export interface Car {
  id: string;
  model: string;
  year: number;
  category: Category;
  seats: number;
  bags: string;
  fuel: string;
  gearbox: string;
  weeklyRate: number;
  plate: string | null;
  status: CarStatus;
  regoExpiry: ISODate | null;
  serviceDue: ISODate | null;
  odometer: number | null;
  photoUrl: string | null;
  listed: boolean;
  sortOrder: number;
}

/** The subset of a car that the public website may see. */
export type PublicCar = Pick<
  Car,
  'id' | 'model' | 'year' | 'category' | 'seats' | 'bags' | 'fuel' | 'gearbox' | 'weeklyRate' | 'status' | 'photoUrl' | 'sortOrder'
>;

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  /** International digits without "+", e.g. 61412558203. Null if not on file. */
  phone: string | null;
  licenceNo: string | null;
}

export interface Rental {
  id: string;
  carId: string;
  customerId: string;
  startDate: ISODate;
  endDate: ISODate | null;
  weeklyRate: number;
  bondAmount: number;
  bondStatus: 'held' | 'refunded' | 'pending';
}

export interface Invoice {
  id: string;
  rentalId: string;
  dueDate: ISODate;
  amount: number;
  paidOn: ISODate | null;
  customerNotified: boolean;
}

export interface AdminData {
  cars: Car[];
  customers: Customer[];
  rentals: Rental[];
  invoices: Invoice[];
}

export interface CustomerData {
  customer: Customer;
  rental: Rental | null;
  car: Car | null;
  invoices: Invoice[];
}

export interface CarInput {
  model: string;
  year: number;
  category: Category;
  seats: number;
  bags: string;
  weeklyRate: number;
  plate: string | null;
  regoExpiry: ISODate | null;
  serviceDue: ISODate | null;
  odometer: number | null;
  listed: boolean;
  photoUrl?: string | null;
}

export interface NewCustomerInput {
  firstName: string;
  lastName: string;
  phone: string;
  licenceNo: string | null;
  carId: string;
  startDate: ISODate;
  weeklyRate: number;
}

export type RequestStatus = 'new' | 'contacted' | 'closed';

/** Booking request sent from the public website. */
export interface BookingRequest {
  id: string;
  createdAt: string; // ISO timestamp
  status: RequestStatus;
  car: string; // e.g. "Honda Civic 2007"
  weeklyRate: number;
  pickDate: ISODate;
  returnDate: ISODate;
  name: string;
  phone: string; // as typed by the customer
  /** Answers to BOOKING_QUESTIONS, stored with the question text so old requests stay readable. */
  answers: { question: string; answer: string }[];
  message: string;
  waitlist: boolean;
  /** Uploaded ID documents (private files, admin only). */
  documents?: { kind: string; label: string; file: string }[];
}

export type NewBookingRequest = Omit<BookingRequest, 'id' | 'createdAt' | 'status'>;
