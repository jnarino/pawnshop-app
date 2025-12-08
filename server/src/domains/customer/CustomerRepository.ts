import { Customer } from './Customer';

export type FindCustomerCriteria = {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;

  // NEW: search by ID document
  idType?: string;
  idNumber?: string;
  idState?: string;
};

export interface CustomerRepository {
  /**
   * Returns a single customer by ID or null if not found.
   */
  findById(id: string): Promise<Customer | null>;

  /**
   * Inserts a new customer and returns the persisted aggregate.
   */
  create(customer: Customer): Promise<Customer>;

  /**
   * Updates an existing customer and returns the persisted aggregate.
   */
  update(customer: Customer): Promise<Customer>;

  /**
   * Deletes a customer by ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Find customers using allowed combinations:
   * - dateOfBirth
   * - dateOfBirth + lastName
   * - lastName
   * - lastName + firstName
   * - dateOfBirth + lastName + firstName
   */
  findCustomer(criteria: FindCustomerCriteria): Promise<Customer[]>;
}
