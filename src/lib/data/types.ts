import type {
  AdminData,
  CarInput,
  CarStatus,
  CustomerData,
  ISODate,
  NewCustomerInput,
  PublicCar,
} from '../types';

export interface Repo {
  mode: 'demo' | 'supabase';
  publicCars(): Promise<PublicCar[]>;
  adminData(): Promise<AdminData>;
  customerData(customerId: string): Promise<CustomerData | null>;
  setInvoicePaid(invoiceId: string, paidOn: ISODate | null): Promise<void>;
  /** Customer says "I've transferred". Must only touch the customer's own invoice. */
  notifyPaid(customerId: string, invoiceId: string): Promise<void>;
  setCarStatus(carId: string, status: CarStatus): Promise<void>;
  saveCar(input: CarInput, id?: string): Promise<string>;
  uploadCarPhoto(carId: string, file: File): Promise<string>;
  addCustomerWithRental(input: NewCustomerInput): Promise<void>;
  endRental(rentalId: string, endDate: ISODate): Promise<void>;
  /** Creates any weekly invoices that are due to exist. Returns how many were created. */
  generateInvoices(today: ISODate): Promise<number>;
}
