# Gun Transaction Flow Verification Guide

This document outlines the detailed process and database operations for ATF-compliant firearms transactions in the system. Use this to verify that the logic is correctly implemented for both standard **Retail Sales** and **Pawn Redemptions**.

---

## 1. Gun Redemption Flow (Pawn)

**Endpoint:** `POST /api/pawn-ticket/pay` (when `amountPaid` >= `redemptionAmount` and item is a gun)

### Workflow Description
When a customer redeems a pawned firearm, the system must perform ATF background checks (compliance), update the Bound Book (`gun_log`), and record financial transactions differently than standard merchandise.

### Step-by-Step database Operations

1.  **Pawn Ticket Payment Update**
    *   **Table:** `pawn_ticket`
    *   **Action:** UPDATE
    *   **Fields:** `amount_paid`, `set_redeemed = true`, `status = 'R'` (Redeemed)

2.  **Inventory Status Update**
    *   **Table:** `inventory_item`
    *   **Action:** UPDATE
    *   **Fields:** `status = 'U'` (In Use/Redeemed - Item returned to customer)
    *   **Filter:** `pawn_ticket_id = {ticketId}`

3.  **Gun Log Compliance (The "Bound Book")**
    *   **Trigger:** System detects `inventory_item` is linked to a `gun_log` record.
    *   **Table:** `gun_log`
    *   **Action:** UPDATE
    *   **Logic:**
        *   `transaction_num`: Generate unique sequential ID (e.g., `100234`)
        *   `nicstn`: Insert NICS Transaction Number from input
        *   `sold_date`: Set to NOW (EST)
        *   `sold_first_name`, `sold_last_name`, `sold_address`, etc.: Copied from Customer record linked to the ticket.
    *   **Critical:** If multiple guns are redeemed in one request, they **MUST** share the same `transaction_num`.

4.  **Gun History Tracking**
    *   **Table:** `gun_transaction_history`
    *   **Action:** INSERT
    *   **Fields:**
        *   `type_id`: UUID for 'REDEEMED' (lookup by code)
        *   `inventory_item_id`: Link to gun
        *   `notes`: "Redeemed from Pawn"

5.  **Financial Transaction 1: The Redemption**
    *   **Table:** `store_transaction`
    *   **Action:** INSERT
    *   **Fields:**
        *   `type_id`: `8` (Redemption)
        *   `amount`: The principal + interest paid
        *   `pawn_ticket_id`: Link to ticket
        *   `note`: "Redemption..."

6.  **Financial Transaction 2: The Background Check Fee (Optional)**
    *   **Condition:** Only if `gunFee > 0` is passed.
    *   **Table:** `store_transaction`
    *   **Action:** INSERT
    *   **Fields:**
        *   **`type_id`:** `24` (Cash Added Main / Misc Income)
        *   **`amount`:** The fee amount (e.g., $5.00)
        *   **`note`:** MUST BE `"GUN PROCESSING FEE BY {USERNAME}"` (UpperCase)
        *   **`tenders`:** The separate tender amount covering this fee.

---

## 2. Gun Retail Sale Flow (Sales)

**Endpoint:** `POST /api/store-transaction`

### Workflow Description
When a gun is sold directly from inventory (not a pawn redemption), the flow is similar but triggered by a Point-of-Sale event.

### Step-by-Step Database Operations

1.  **Inventory Stock Update**
    *   **Table:** `inventory_item`
    *   **Action:** UPDATE
    *   **Fields:** `status = 'S'` (Sold), `quantity` decreased.

2.  **Gun Log Compliance**
    *   **Trigger:** Item being sold has a `gun_log` entry.
    *   **Table:** `gun_log`
    *   **Action:** UPDATE
    *   **Logic:**
        *   `transaction_num`: Generate unique sequential ID
        *   `sold_amount`: The sale price
        *   `sold_date`: NOW (EST)
        *   `sold_first_name`, etc.: Copied from the Customer entity attached to the sale.

3.  **Gun History Tracking**
    *   **Table:** `gun_transaction_history`
    *   **Action:** INSERT
    *   **Fields:**
        *   `type_id`: UUID for 'SOLD' ('c089608b-...')
        *   `notes`: "Sold from Inventory"

4.  **Financial Transaction 1: The Sale**
    *   **Table:** `store_transaction`
    *   **Action:** INSERT
    *   **Fields:**
        *   `type_id`: `10` (Retail Sale)
        *   `amount`: Sale subtotal + Tax
        *   `items`: Links to `store_transaction_item` for line verification.

5.  **Financial Transaction 2: The Background Check Fee (Optional)**
    *   **Condition:** If `gunFee > 0` or `gunProcFee > 0` is passed.
    *   **Table:** `store_transaction`
    *   **Action:** INSERT
    *   **Fields:**
        *   **`type_id`:** `24` (Cash Added Main / Misc Income)
        *   **`amount`:** The fee amount
        *   **`note`:** `GUN PROCESSING FEE-P BY {USERNAME}` (Note slight format diff: "-P" typically used in sales).
        *   **`customerId`**: Linked to buyer.

---

## Verification Checklist

| Check Point | Redemption (Pawn) | Retail Sale |
| :--- | :--- | :--- |
| **Inventory Status** | becomes 'U' (Redeemed/In Use) | becomes 'S' (Sold) |
| **Recieves Transfer #?** | Yes | Yes |
| **Gun History Type** | 'REDEEMED' | 'SOLD' |
| **Main Transaction Type** | 8 (Redemption) | 10 (Retail Sale) |
| **Fee Transaction Type** | 24 (Misc Income) | 24 (Misc Income) |
| **Fee Note Format** | `GUN PROCESSING FEE BY ADMIN` | `GUN PROCESSING FEE-P BY ADMIN` |
