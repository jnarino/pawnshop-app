import { Customer } from '../../domain/customer/Customer';
import { ValidationError } from '../errors';

export function validateNewCustomer(input: Omit<Customer, 'id'>): Omit<Customer, 'id'> {
  if (!input.firstName?.trim()) {
    throw new ValidationError('firstName is required');
  }
  
  if (!input.lastName?.trim()) {
    throw new ValidationError('lastName is required');
  }
  
  // Validate date format if provided
  if (input.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth)) {
    throw new ValidationError('dateOfBirth must be in YYYY-MM-DD format');
  }
  
  // Validate UUIDs if color IDs are provided
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (input.hairColorId && !uuidRegex.test(input.hairColorId)) {
    throw new ValidationError('hairColorId must be a valid UUID');
  }
  
  if (input.eyeColorId && !uuidRegex.test(input.eyeColorId)) {
    throw new ValidationError('eyeColorId must be a valid UUID');
  }
  
  return {
    ...input,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    middleName: input.middleName?.trim() || null,
    // Normalize other string fields
    streetAddress: input.streetAddress?.trim() || null,
    city: input.city?.trim() || null,
    stateUs: input.stateUs?.trim() || null,
    zipCode: input.zipCode?.trim() || null,
    phoneNumber: input.phoneNumber?.trim() || null,
    cellPhone: input.cellPhone?.trim() || null,
    email: input.email?.trim() || null,
  };
}

export function validateCustomerUpdate(input: Partial<Customer>): Partial<Customer> {
  if (input.firstName !== undefined && !input.firstName?.trim()) {
    throw new ValidationError('firstName cannot be empty');
  }
  
  if (input.lastName !== undefined && !input.lastName?.trim()) {
    throw new ValidationError('lastName cannot be empty');
  }
  
  // Validate date format if provided
  if (input.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth)) {
    throw new ValidationError('dateOfBirth must be in YYYY-MM-DD format');
  }
  
  // Validate UUIDs if color IDs are provided
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (input.hairColorId && !uuidRegex.test(input.hairColorId)) {
    throw new ValidationError('hairColorId must be a valid UUID');
  }
  
  if (input.eyeColorId && !uuidRegex.test(input.eyeColorId)) {
    throw new ValidationError('eyeColorId must be a valid UUID');
  }
  
  return {
    ...input,
    firstName: input.firstName?.trim(),
    lastName: input.lastName?.trim(),
    middleName: input.middleName?.trim() || null,
  };
}
