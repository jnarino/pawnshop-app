# Cash Drawer Services - Quick Reference

## Four Services Working Together

### 1. **Remove Cash From Main Drawer** (`RemoveCashFromMainDrawerUseCase`)
- **Type**: Type 25 (CASH OUT - MAIN)
- **Purpose**: Take cash out of drawer to deposit in main safe
- **Input**: Amount (positive) + Optional note/timestamp
- **Amount Logic**: Converts to negative internally
- **Tender**: CASH only (type 1)
- **Route**: `POST /api/store-transaction/remove-cash-from-main-drawer`

**Example:**
```json
{
  "amount": 100,
  "note": "Daily deposit",
  "occurredAt": "2025-12-12T18:00:00.000Z"
}
```

---

### 2. **Add Money To Main Drawer** (`AddMoneyToMainDrawerUseCase`)
- **Purpose**: Add money from bank or other sources back to drawer
- **Type 26**: When `isFromBank=true` (from bank operations)
- **Type 24**: When `isFromBank=false` (from other sources)
- **Input**: Amount (positive) + Tender type + isFromBank flag
- **Tender Validation**: If bank=true, only CASH allowed
- **Tender**: Any of 8 types
- **Route**: `POST /api/store-transaction/add-money-to-main-drawer`

**Example:**
```json
{
  "amount": 500,
  "transactionTenderName": "CASH",
  "isFromBank": true,
  "note": "Bank transfer",
  "occurredAt": "2025-12-12T09:00:00.000Z"
}
```

---

### 3. **List Balance Cash Drawer** (`ListBalanceCashDrawerUseCase`)
- **Purpose**: Query current drawer balance with breakdown by tender
- **Input**: Optional `asOf` timestamp
- **Calculation**: 
  - Gets last MAIN BALANCE transaction (type 23)
  - Sums all activity since that date
  - Returns: `lastCloseBalance + activitySum`
- **Output**: Object with all 8 tender types (always present, even if 0)
- **Route**: `GET /api/store-transaction/balance`

**Response:**
```json
{
  "asOf": "2025-12-12T12:00:00.000Z",
  "mainDrawerBalance": {
    "CASH": 1200,
    "AMERICAN EXPRESS": 0,
    "DEBIT": 400,
    "DISCOVER": 0,
    "MASTER CARD": 239.63,
    "VISA": 0,
    "CHECK": 0,
    "CASH PASS": 0
  }
}
```

---

### 4. **Close Balance Cash Drawer** (`CloseBalanceCashDrawerUseCase`) ⭐ Most Complex
- **Purpose**: End-of-day reconciliation and balance reset
- **Input**: mainDrawerBalance object (all 8 tenders with amounts to deposit)
- **Process**:
  1. Gets last close balance
  2. Sums all activity since
  3. **Reconciliation check**: `lastBalance + activity - deposits = 0`
  4. Creates DEPOSIT transactions (type 22) for each tender = NEGATIVE amounts
  5. Creates MAIN BALANCE transaction (type 23) = POSITIVE cash amount
- **Validation**: Fails if math doesn't balance
- **Route**: `PUT /api/store-transaction/close-balance`

**Request:**
```json
{
  "mainDrawerBalance": {
    "CASH": 1200,
    "AMERICAN EXPRESS": 0,
    "DEBIT": 400,
    "DISCOVER": 0,
    "MASTER CARD": 239.63,
    "VISA": 0,
    "CHECK": 0,
    "CASH PASS": 0
  },
  "note": "End of day close",
  "occurredAt": "2025-12-12T18:00:00.000Z"
}
```

**Response:** Array of created transactions
```json
[
  {
    "id": "...",
    "typeId": 22,
    "typeName": "DEPOSIT FROM MAIN (to drawer)",
    "amount": -1200,
    "tenders": [{"tenderTypeId": 1, "tenderTypeName": "CASH", "amount": -1200}]
  },
  {
    "id": "...",
    "typeId": 22,
    "typeName": "DEPOSIT FROM MAIN (to drawer)",
    "amount": -400,
    "tenders": [{"tenderTypeId": 3, "tenderTypeName": "DEBIT", "amount": -400}]
  },
  {
    "id": "...",
    "typeId": 23,
    "typeName": "MAIN BALANCE (admin)",
    "amount": 1200,
    "tenders": []
  }
]
```

---

## Reconciliation Math Explained

### Why the deposits go negative?
Deposits are *removing money from the drawer* (going to main safe/bank), so they're recorded as negative transactions in the drawer's perspective.

### Why it needs to balance?
```
Last Close Balance: $1000
+ Activity Since:   +$200 (net)
- Deposits Now:     -$1200 (taking these out)
= Remaining:        $0 (balanced, ready for next day)
```

The final MAIN BALANCE (1200) becomes tomorrow's starting balance.

### Error Examples

**Cash mismatch:**
```
CASH reconciliation failed: Last balance (1000.00) + Activity (200.00) - Deposit (1000.00) = 200.00 (expected 0)
→ You said you're depositing 1000, but you should have 1200 in the drawer
```

**Activity without deposit:**
```
VISA has 100.00 activity but no deposit recorded
→ $100 in VISA transactions happened, but you're not depositing anything
```

---

## Tender Type IDs

| Name | ID |
|------|-----|
| CASH | 1 |
| AMERICAN EXPRESS | 2 |
| DEBIT | 3 |
| DISCOVER | 4 |
| MASTER CARD | 5 |
| VISA | 6 |
| CHECK | 7 |
| CASH PASS | 8 |

---

## Transaction Type IDs

| Type | ID | Name | Amount | Use Case |
|------|-----|------|--------|----------|
| 22 | 22 | DEPOSIT FROM MAIN | NEGATIVE | Taking money out of drawer |
| 23 | 23 | MAIN BALANCE | POSITIVE | Recording balance snapshot |
| 24 | 24 | CASH ADDED - MAIN | POSITIVE | Adding money (non-bank) |
| 25 | 25 | CASH OUT - MAIN | NEGATIVE | Removing cash to safe |
| 26 | 26 | WITHDRAWAL FROM BANK | POSITIVE | Adding money from bank |

---

## Daily Workflow

```
Morning:
  1. Query balance → GET /api/store-transaction/balance
  2. See starting cash = $1200 (from yesterday's close)

During day:
  3. Sales, payments, etc. → Activity accumulates

If need to remove cash:
  4. Remove cash → POST /api/store-transaction/remove-cash-from-main-drawer

If receive bank deposit:
  5. Add money → POST /api/store-transaction/add-money-to-main-drawer

End of day:
  6. Check balance → GET /api/store-transaction/balance
  7. Collect and count all tenders
  8. Close balance → PUT /api/store-transaction/close-balance
     ✓ Reconciliation happens
     ✓ DEPOSIT transactions created
     ✓ New starting balance recorded

Tomorrow:
  1. Query balance → Starting balance ready for next day
```

---

## Key Constraints

- ✅ All amounts must be positive in requests (logic converts as needed)
- ✅ Close balance MUST reconcile perfectly (within 0.01 tolerance)
- ✅ Every tender with activity must have a deposit recorded at close
- ✅ All 8 tender types appear in balance response (even if 0)
- ✅ CASH from bank operations MUST be type 26
- ✅ Non-CASH from bank operations are REJECTED
- ✅ Activity from any tender requires deposit at close time
