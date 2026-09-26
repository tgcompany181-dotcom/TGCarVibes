import type { DataMode } from '../config';
import type {
  AdminData,
  CarInput,
  CarStatus,
  Contract,
  BookingRequest,
  Customer,
  CustomerData,
  ISODate,
  NewBookingRequest,
  NewCustomerInput,
  PublicCar,
  RequestStatus,
  ServiceRecord,
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
  listRequests?(): Promise<BookingRequest[]>;
  addRequest?(input: NewBookingRequest): Promise<void>;
  setRequestStatus?(id: string, status: RequestStatus): Promise<void>;
  deleteRequest?(id: string): Promise<void>;
  saveDocument?(file: File, ext: string): Promise<string>;
  readDocument?(name: string): Promise<Buffer | null>;
  listContracts?(): Promise<Contract[]>;
  getContract?(id: string): Promise<Contract | null>;
  getContractByToken?(token: string): Promise<Contract | null>;
  saveContract?(contract: Contract): Promise<void>;
  deleteContract?(id: string): Promise<void>;
  listServices?(): Promise<ServiceRecord[]>;
  /** Also moves the car's next-service date and odometer forward. */
  addService?(input: Omit<ServiceRecord, 'id'>): Promise<void>;
  deleteService?(id: string): Promise<void>;
  updateService?(id: string, input: Omit<ServiceRecord, 'id' | 'carId'>): Promise<void>;
  getBanners?(): Promise<string[]>;
  addBanner?(file: File): Promise<void>;
  setBanners?(urls: string[]): Promise<void>;
  getAdminAuth?(): Promise<{ passwordHash: string; epoch: number } | null>;
  /** Returns the new session epoch. */
  setAdminPassword?(passwordHash: string): Promise<number>;
}
