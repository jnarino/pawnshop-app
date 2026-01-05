# Close Balance Cash Drawer Service

## Overview

The `CloseBalanceCashDrawerUseCase` reconciles the cash drawer at end of day by:

1. **Retrieving transaction history** - Gets the last MAIN BALANCE and all activity since
2. **Calculating totals by tender** - Sums deposits/payments grouped by tender type
3. **Reconciling the math** - Verifies: `lastBalance + activity - deposits = 0`
4. **Creating transactions** - Records DEPOSIT FROM MAIN (type 22) for each tender, then MAIN BALANCE (type 23)

## Request Format

```json
{
  "mainDrawerBalance": {
    "CASH": 1200,
    "AMERICAN EXPRESS": 0,
    "DEBIT": 400,
    "DISCOVER": 0,
    "MASTER CARD": 0,
    "VISA": 0,
    "CHECK": 0,
    "CASH PASS": 0
  },
  "occurredAt": "2025-12-12T18:00:00.000Z",
  "note": "End of day close"
}
```

### Input Fields

- **mainDrawerBalance** (required): Object with all 8 tender types and positive amounts to deposit
  - `CASH`: Final cash amount in drawer
  - `AMERICAN EXPRESS`: Amount collected
  - `DEBIT`: Amount collected
  - `DISCOVER`: Amount collected
  - `MASTER CARD`: Amount collected
  - `VISA`: Amount collected
  - `CHECK`: Amount collected
  - `CASH PASS`: Amount collected

- **occurredAt** (optional): ISO datetime for transaction timestamp (defaults to now)
- **note** (optional): Description for the close

## Reconciliation Logic

For **CASH** (tender type 1):
```
lastCloseBalance + cashActivity - cashDeposit = 0
```

For **all other tenders**:
```
tenderActivity - tenderDeposit = 0
```

If reconciliation fails, an error is thrown with details:
```
CASH reconciliation failed: Last balance (1000.00) + Activity (200.00) - Deposit (1200.00) = 0.00 (expected 0)
DEBIT reconciliation failed: Activity (400.00) - Deposit (400.00) = 0.00 (expected 0)
VISA has 100.00 activity but no deposit recorded
```

## Response Format

Array of created transactions (DEPOSIT FROM MAIN + MAIN BALANCE):

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "customerId": null,
    "clerkUserId": "clerk-123",
    "typeId": 22,
    "typeName": "DEPOSIT FROM MAIN (to drawer)",
    "occurredAt": "2025-12-12T18:00:00.000Z",
    "amount": -1200,
    "taxSales": null,
    "taxExemptUsed": false,
    "stateTax": null,
    "tenderChange": null,
    "gunProcFee": null,
    "note": "End of day close",
    "createdAt": "2025-12-12T18:00:00.000Z",
    "updatedAt": "2025-12-12T18:00:00.000Z",
    "tenders": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "storeTransactionId": "550e8400-e29b-41d4-a716-446655440001",
        "tenderTypeId": 1,
        "tenderTypeName": "CASH",
        "amount": -1200,
        "createdAt": "2025-12-12T18:00:00.000Z"
      }
    ],
    "items": []
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "customerId": null,
    "clerkUserId": "clerk-123",
    "typeId": 22,
    "typeName": "DEPOSIT FROM MAIN (to drawer)",
    "occurredAt": "2025-12-12T18:00:00.000Z",
    "amount": -400,
    "taxSales": null,
    "taxExemptUsed": false,
    "stateTax": null,
    "tenderChange": null,
    "gunProcFee": null,
    "note": "End of day close",
    "createdAt": "2025-12-12T18:00:00.000Z",
    "updatedAt": "2025-12-12T18:00:00.000Z",
    "tenders": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440004",
        "storeTransactionId": "550e8400-e29b-41d4-a716-446655440003",
        "tenderTypeId": 3,
        "tenderTypeName": "DEBIT",
        "amount": -400,
        "createdAt": "2025-12-12T18:00:00.000Z"
      }
    ],
    "items": []
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440005",
    "customerId": null,
    "clerkUserId": "clerk-123",
    "typeId": 23,
    "typeName": "MAIN BALANCE (admin)",
    "occurredAt": "2025-12-12T18:00:00.000Z",
    "amount": 1200,
    "taxSales": null,
    "taxExemptUsed": false,
    "stateTax": null,
    "tenderChange": null,
    "gunProcFee": null,
    "note": "End of day close",
    "createdAt": "2025-12-12T18:00:00.000Z",
    "updatedAt": "2025-12-12T18:00:00.000Z",
    "tenders": [],
    "items": []
  }
]
```

## Transaction Types Created

### Type 22: DEPOSIT FROM MAIN (to drawer)
- Created for each tender with a deposit amount > 0
- Amount is **NEGATIVE** (money leaving drawer)
- Links to corresponding tender in `tenders` array
- Example: Depositing $1200 in CASH creates a -1200 transaction

### Type 23: MAIN BALANCE (admin)
- Created last, after all deposits
- Amount is **POSITIVE** (the new starting balance)
- Example: Final balance of $1200 creates a +1200 transaction
- Used by `getLastClose()` to get the previous day's starting balance

## Database Impact

```sql
-- Creates entries in these tables:
INSERT INTO store_transaction (id, clerk_user_id, type_id, occurred_at, amount, note, created_at, updated_at)
VALUES ('...', 'clerk-123', 22, '2025-12-12 18:00:00', -1200, 'End of day close', NOW(), NOW());

INSERT INTO store_transaction_tender (id, store_transaction_id, tender_type_id, amount, created_at)
VALUES ('...', '...', 1, -1200, NOW());

-- Then for the balance:
INSERT INTO store_transaction (id, clerk_user_id, type_id, occurred_at, amount, note, created_at, updated_at)
VALUES ('...', 'clerk-123', 23, '2025-12-12 18:00:00', 1200, 'End of day close', NOW(), NOW());
```

## Example Flow

**Starting State (from previous close):**
- Last balance: $1000

**Activity during the day:**
- CASH sales: +$500
- CASH payouts: -$300
- Net CASH activity: +$200
- DEBIT transactions: +$400

**Drawer contents at close:**
- CASH: $1200 (1000 + 200)
- DEBIT: $400

**Close Request:**
```json
{
  "mainDrawerBalance": {
    "CASH": 1200,
    "DEBIT": 400,
    ...other tenders 0
  },
  "note": "End of day"
}
```

**Reconciliation:**
```
CASH: 1000 (last) + 200 (activity) - 1200 (deposit) = 0 ✓
DEBIT: 400 (activity) - 400 (deposit) = 0 ✓
```

**Created Transactions:**
1. DEPOSIT FROM MAIN: -1200 (CASH)
2. DEPOSIT FROM MAIN: -400 (DEBIT)
3. MAIN BALANCE: +1200 (starting balance for tomorrow)

**Result:**
- Tomorrow's starting balance = $1200
- Drawer is now empty
- All transactions recorded and balanced
