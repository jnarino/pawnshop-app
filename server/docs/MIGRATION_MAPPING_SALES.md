# Sales & Transaction Migration Mapping Guide

This document explains the mapping strategy between the legacy PawnMaster MSSQL database and the new Pawnshop architecture. It also provides context on the data structure and specific "legacy oddities" like NULL values and duplicate transaction lines.

## 1. Legacy Data Structure Overview

The legacy system uses a distributed approach to storing sales data across three main tables.

### The Three Pillars

1.  **`Acct` (The Ledger)**
    *   **Purpose:** The central financial register. Every financial movement (sales, payments, voids, payouts) is recorded here.
    *   **Key Behavior:** This is the "Truth" for financial reporting. It defines *when* money moved, *how* much, and *how* (Tender).
    *   **Critical Columns:** `TICKETNUM` (Group ID), `DATEin` (Time), `TYPE` (Transaction Type), `AMOUNT`, `TENDERTYP1`, `TAXSALES`.

2.  **`sold` (Sale Header Details)**
    *   **Purpose:** Provides specific metadata for "Merchandise Sales" and "Layaways".
    *   **Key Behavior:** Contains customer linkage (`CUS_FK`) and total calculations (`SaleAmt`, `TAX`).
    *   **Relationship:** 1-to-1 with `Acct` (usually) for Sales types (`SS`, `SL`, etc.). Linked via `TICKETNUM`.

3.  **`sitems` (Line Items)**
    *   **Purpose:** The detailed list of items *inside* a transaction.
    *   **Key Behavior:** Contains the specific Inventory Number (`INVNUM`), Description of goods, and individual line prices.
    *   **Relationship:** Many-to-1 with `sold`/`Acct`. Linked via `TICKETNUM`.

---

## 2. Why are there so many NULL values?

The legacy database uses a **"Wide Table" (Denormalized)** design.

*   **Context Specificity:** The tables are designed to hold data for *every possible type* of transaction (Pawn, Sale, Repair, Layaway, Void).
    *   *Example:* `SRVCHGPERC` (Service Charge Percent) is only relevant for Layaways. For a regular Sale, it is `NULL`.
    *   *Example:* `RETURNEDAMT` is only relevant for returns.
*   **Legacy Unused Columns:** Columns like `PrevDate`, `SalesLoc`, or `bin` are often unused in newer versions of the software but remain in the schema for compatibility, resulting in 100% NULLs.

**Rule of Thumb:** In the migration, if a value is NULL in the source, it usually implies the default state (e.g., 0 for amounts, false for flags) or that the specific feature (like Layaway terms) triggers only when data is present.

---

## 3. Migration Mapping Model

### A. StoreTransaction (Header)
**Target Table:** `store_transaction`
**Primary Source:** `Acct` (Fallback to `sold` if `Acct` entry missing but `sold` exists)

| New Column | Legacy Source | Logic / Notes |
| :--- | :--- | :--- |
| `id` | UUID | Generated (or mapped from `Act_id` / `sld_id` if valid UUIDs) |
| `legacy_acct_pk` | `Acct.Acct_PK` | Used to prevent duplicate migrations |
| `legacy_ticketnum` | `Acct.TICKETNUM` | **The Critical Link**. Groups Items and Tenders. |
| `occurred_at` | `Acct.DATEin` | The actual time of sale. |
| `amount` | `Acct.AMOUNT` | Total transaction value. |
| `tax_sales` | `Acct.TAXSALES` | |
| `state_tax` | `Acct.STATETAX` | |
| `customer_id` | `Acct.CUS_FK` | Maps to `customer_map.json` to find new UUID. |
| `clerk_user_id` | `Acct.Usr_FK` | Maps to `user_map.json`. |
| `type_id` | `Acct.TYPE` | **Mapping Required:**<br>`SS` -> Sale<br>`SL` -> Layaway Down/Payment<br>`SLP` -> Layaway Pickup<br>`B` -> Pawn Loan (Separate process, mostly)<br>**Important:** Filter out Type `T` (See Section 4). |

### B. StoreTransactionTender (Payments)
**Target Table:** `store_transaction_tender`
**Source:** `Acct`

Legacy stores up to 2 payment methods in flat columns. We normalize this to 1-to-many rows.

| New Column | Legacy Source | Logic |
| :--- | :--- | :--- |
| `store_transaction_id` | `Acct.TICKETNUM` | Join to created Header |
| `tender_type_id` | `Acct.TENDERTYP1` | Mapped to `tender_type` table (e.g., 1=CASH, 6=VISA) |
| `amount` | `Acct.TENDERAMT1` | |
| *(Row 2)* | `Acct.TENDERAMT2` | Create 2nd row if `TENDERAMT2` != 0 |

### C. StoreTransactionItem (Line Items)
**Target Table:** `store_transaction_item`
**Source:** `sitems`

| New Column | Legacy Source | Logic |
| :--- | :--- | :--- |
| `store_transaction_id` | `sitems.TICKETNUM` | Join to created Header |
| `inventory_item_id` | `sitems.INVNUM` | Lookup in `inventory_item` table by `inventory_number` to get UUID. |
| `description` | `sitems.DESCRIPT` | |
| `quantity` | `sitems.NUMBERSOLD` | |
| `line_amount` | `sitems.AMOUNT` | Price sold at. |
| `line_cost` | `sitems.COST` | |
| `status` | `sitems.Status` | e.g., 'S' (Sold), 'L' (Layaway) |

---

## 4. Special Case: The "Type T" Duplicates

In your `Acct` data, you will often see pairs of records for the same `TICKETNUM` and Timestamp:

1.  **Type `SS`** (Sale): The actual financial record with Tenders, Tax, and Totals.
2.  **Type `T`** (Tracking/Commission?): Often has `dPERCENT=100`.

**Example from your data (Ticket 111418):**
*   `SS`: Amount 18.78, Tax 1.22. (The real sale)
*   `T`: Amount 18.78, Tax 0.00. (The shadow copy)

**Migration Strategy:**
*   **IGNORE Type `T`** records when migrating `StoreTransaction`.
*   They are internal legacy accounting artifacts (likely for commission tracking or cost-of-goods-sold calculation triggers in the old software).
*   Migrating them would duplicate sales revenue.
*   **Filter:** `WHERE TYPE NOT IN ('T')` (unless specific business logic dictates otherwise).

## 5. SQL Implementation Notes

When migrating from `sold` vs `Acct`:
1.  **Prioritize `Acct`**: It has the tender (Cash/Card) split.
2.  **Join `sitems`**: use `TICKETNUM` to grab all items belonging to that sale.
3.  **Cross-Check**: Ensure `SUM(sitems.AMOUNT) + Tax ≈ Acct.AMOUNT`. Discrepancies may indicate discounts or manual overrides in `Acct`. The `Acct.AMOUNT` is the truth for "Money in Drawer".

