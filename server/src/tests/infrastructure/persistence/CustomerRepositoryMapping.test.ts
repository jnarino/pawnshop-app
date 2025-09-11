import assert from 'assert';
import { mapRowToCustomer } from '../../../infrastructure/persistence/CustomerRepository';
import { test } from '../../testHarness';

const row = {
  id: 'abc-123',
  first_name: 'John',
  middle_name: null,
  last_name: 'Doe',
  street_address: '123 Main',
  city: 'Townsville',
  state_us: 'TX',
  zip_code: '75001',
  phone_number: '555-1111',
  date_of_birth: '1990-01-01',
  sex: 'M',
  eye_color: 'Brown',
  height: "5'10\"",
  id_number: 'ID123',
  id_expiration: '2030-01-01',
  id_issue_date: '2020-01-01',
  id_state: 'TX',
  ss_number: null,
  weight: '180',
  hair_color: 'Black',
  race: 'White'
};

test('infrastructure/persistence: mapRowToCustomer maps new schema correctly', () => {
  const c = mapRowToCustomer(row);
  assert.strictEqual(c.firstName, 'John');
  assert.strictEqual(c.middleName, null);
  assert.strictEqual(c.stateUs, 'TX');
  assert.strictEqual(c.zipCode, '75001');
  assert.strictEqual(c.idIssueDate, '2020-01-01');
  assert.strictEqual(c.idExpiration, '2030-01-01');
  assert.strictEqual(c.idNumber, 'ID123');
});
