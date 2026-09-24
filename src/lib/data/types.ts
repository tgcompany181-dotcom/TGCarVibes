import type { DataMode } from '../config';
import type {
  AdminData,
  CarInput,
  CarStatus,
  Customer,
  CustomerData,
  ISODate,
  NewCustomerInput,
  PublicCar,
} from '../types';

export interface Repo {
  mode: DataMode;
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
  updateCustomer(id: string, input: Pick<Customer, 'firstName' | 'lastName' | 'phone' | 'licenceNo'>): Promise<void>;
  /** Creates any weekly invoices that are due to exist. Returns how many were created. */
  generateInvoices(today: ISODate): Promise<number>;
  /** Local/demo modes only: customer sign-in with mobile + PIN. */
  findCustomerByPhone?(phone: string): Promise<{ id: string; pinHash?: string } | null>;
  setCustomerPin?(customerId: string, pinHash: string): Promise<void>;
  getAdminAuth?(): Promise<{ passwordHash: string; epoch: number } | null>;
  /** Returns the new session epoch. */
  setAdminPassword?(passwordHash: string): Promise<number>;
}
