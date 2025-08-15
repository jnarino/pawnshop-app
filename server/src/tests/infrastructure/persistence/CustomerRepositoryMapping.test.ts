import assert from 'assert';
import { mapRowToCustomer } from '../../../infrastructure/persistence/CustomerRepository';
import { test } from '../../testHarness';

const row = {
  id: 'abc-123',
  firstName: 'John',
  middleName: null,
  lastName: 'Doe',
  suffix: null,
  dateOfBirth: '1990-01-01',
  sex: 'M',
  eyeColor: 'Brown',
  height: '5\'10"',
  streetAddress: '123 Main',
  city: 'Townsville',
  stateUs: 'TX',
  zipcode: '75001',
  idNumber: 'ID123',
  expirationDate: '2030-01-01',
  issueDate: '2020-01-01',
  issuingState: 'TX',
  phone: '555-1111',
  email: 'john@example.com'
};

test('infrastructure/persistence: mapRowToCustomer maps aliases correctly', () => {
  const c = mapRowToCustomer(row);
  assert.strictEqual(c.firstName, 'John');
  assert.strictEqual(c.middleName, undefined);
  assert.strictEqual(c.stateUs, 'TX');
  assert.strictEqual(c.zipcode, '75001');
  assert.strictEqual(c.issueDate, '2020-01-01');
});
