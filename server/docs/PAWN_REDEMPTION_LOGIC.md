# Pawn Redemption Logic Explained

This document explains the logic behind charge calculations, specifically concerning "Redemption Amount" normalization when loan periods align exactly with 30-day boundaries.

## The Discrepancy

We encountered a scenario where the **Current Charges** were calculated correctly, but the **Redemption Amount** was lower than `PawnPrincipal + CurrentCharges`.

### Scenario Data
- **Pawn Amount:** 300
- **Rate:** 25% ($75/month)
- **Start Date:** Oct 17, 2025
- **Reference Date:** Jan 15, 2026 (Exactly 90 days / 3 periods later)
- **Payments:** 1 month paid ($75) on Dec 15.
- **Periods Due Total:** 3 (90 days / 30 = 3 full periods)
- **Periods Paid:** 1
- **Periods Behind:** 2 (Periods 2 and 3)

### Expected Calculation
- **Current Charges:** 2 periods owed * $75 = $150.
- **Expected Redemption:** Principal ($300) + Charges ($150) = **$450**.

### The "Bug" in Legacy Logic
The original redemption formula attempted to be "fairer" by prorating the *last* period owed, using this formula:
```javascript
redemptionAmount = pawnAmount + (periodsBehind - 1) * monthly + prorated
```

In this specific case (Day 90):
- **Periods Behind:** 2
- **Days Since Last Due:** 0 (because we are exactly on the 90th day)
- **Prorated:** 0 (0 days * daily rate)

Resulting Calculation:
```
Redemption = 300 + (2 - 1) * 75 + 0
           = 300 + 75 + 0
           = 375
```
This is **$375**, which effectively charges for only 1 period of interest, despite the customer being 2 periods behind.

The discrepancy occurs because `periodsBehind` counts COMPLETED periods. Since we were on Day 90, we had fully completed Period 3.  The proration formula assumes the "last" period in the count is a *partial* one currently being accrued. But when `daysSinceLastDue == 0`, the last period is actually a FULLY completed period.

## The Logic Fix

The logic was updated to check if we are exactly on a cycle boundary.

1. **Calculate Days Into Period**: We check `daysSinceLastDue`.
2. **If `daysSinceLastDue == 0`**: We just finished a full cycle. The "last" period is full, not partial.
   - **Correction**: Charge full monthly rate for all `periodsBehind`.
   - `redemptionAmount = pawnAmount + periodsBehind * monthly`
3. **If `daysSinceLastDue > 0`**: We are partially into the next period.
   - **Operation**: Use the standard proration formula.
   - `redemptionAmount = pawnAmount + (periodsBehind - 1) * monthly + prorated`

### Code Implementation
```typescript
if (daysSinceLastDue === 0 && periodsBehind > 0) {
    // Exact cycle boundary (e.g., Day 60, 90). No proration needed.
    redemptionAmount = round2(pawnAmount + periodsBehind * monthly);
} else {
    // Partial period. Prorate the last one.
    redemptionAmount = round2(pawnAmount + (periodsBehind - 1) * monthly + prorated);
}
```

This ensures that on day 90, the redemption amount properly reflects the 2 full periods owed ($450), aligning with the `currentCharges` ($150).
