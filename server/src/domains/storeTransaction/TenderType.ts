/**
 * Mirrors the values seeded into tender_type.id
 *
 * INSERT INTO tender_type(id, name, legacy_code) VALUES
 *   (1, 'CASH',             '1001'),
 *   (2, 'AMERICAN EXPRESS', '35001'),
 *   (3, 'DEBIT',            '36001'),
 *   (4, 'DISCOVER',         '37001'),
 *   (5, 'MASTER CARD',      '38001'),
 *   (6, 'VISA',             '39001'),
 *   (7, 'CHECK',            '287001'),
 *   (8, 'CASH PASS',        '1186001');
 */
export enum TenderType {
  CASH = 1,
  AMERICAN_EXPRESS = 2,
  DEBIT = 3,
  DISCOVER = 4,
  MASTER_CARD = 5,
  VISA = 6,
  CHECK = 7,
  CASH_PASS = 8,
}
