# Daily Report File Format Analysis

## File Type
Fixed-width format text file with pawn/buy transaction records

## Overall Structure
Each line represents a **transaction with multiple items**. If a customer pawns/buys multiple items in one transaction, each item gets a separate line but shares the same control number.

---

## Column Breakdown (Fixed Width)

### STORE INFORMATION (Positions 1-45)
| Field | Width | Example | Notes |
|-------|-------|---------|-------|
| **Control/Ticket Number** | 6 | 117376 | Unique transaction ID |
| **Store Name** | 30 | LARRY'S ESTATE JEWELRY & PAWN | Left-aligned, padded |
| **Store Address** | 30 | 3316 CLEVELAND AVE. | Left-aligned, padded |
| **Store City** | 20 | FORT MYERS | Left-aligned, padded |
| **Store State** | 2 | FL | State code |
| **Store Zip** | 6 | 33901- | Format: XXXXX- |
| **Store Phone** | 12 | (239) 939-3633 | Format: (XXX) XXX-XXXX |

### TRANSACTION INFO (Positions ~45-80)
| Field | Width | Example | Notes |
|-------|-------|---------|-------|
| **Trans Date** | 8 | 20251008 | YYYYMMDD format |
| **Trans Time** | 8 | 10:17:00 | HH:MM:SS format |
| **Trans Type** | 1 | P or B | P=Pawn, B=Buy |

### CUSTOMER INFORMATION (Positions ~80-250)
| Field | Width | Example | Notes |
|-------|-------|---------|-------|
| **First Name** | 15 | JUAN | Left-aligned, padded |
| **Middle Name** | 15 | ALBERTO | Left-aligned, padded |
| **Last Name** | 24 | DEJESUS JR | Left-aligned, padded |
| **Date of Birth** | 8 | 19800625 | YYYYMMDD format |
| **Gender** | 1 | M or F | M/F |
| **Race** | 1 | W or H or A or P | white hispanic africanAmerican pacific islander
| **Customer Address** | 25 | 2096 RUTLAND ST | Left-aligned, padded |
| **Customer City** | 20 | OPA LOCKA | Left-aligned, padded |
| **Customer State** | 2 | FL | State code |
| **Customer Zip** | 6 | 33054- | Format: XXXXX- |
| **Customer Phone** | 12 | (305) 570-6960 | Format: (XXX) XXX-XXXX |
| **Employer/Business** | 35 | RAYS PRO PAINTING | What customer is employed/associated with |
| **Alt Phone (with parens)** | 6 | (   ) | Alternative phone or placeholder |
| **ID #** | 12 | D22242180225 | Driver's license or ID number |
| **ID Type** | 12 | FL DRIVERS | FL DRIVERS, STATE ID, HT IMMIGRA, etc. |

### CUSTOMER PHYSICAL DESC (Positions ~250-290)
| Field | Width | Example | Notes |
|-------|-------|---------|-------|
| **Height** | 6 | 5' 11" | Format: X' XX" |
| **Weight** | 3 | 210 | In pounds |
| **Hair Color** | 5 | BROWN | BROWN, BLACK, BLONDE, etc. |
| **Eye Color** | 5 | BLACK | BLACK, BROWN, BLUE, GREEN, etc. |

### ITEM DESCRIPTION & SPECS (Positions ~290-550)
| Field | Width | Example | Notes |
|-------|-------|---------|-------|
| **Item Type** | 12 | RING | RING, WATCH, BRACELET, CHARM, PENDANT, EARRINGS, NECKLACE, etc. |
| **Brand/Maker** | 12 | NONE | Brand name or "NONE" |
| **Model/Serial/Details** | ~60 | YELLOW 10K MANS CZ CLUSTER RING 5.1GRMS | Description of item |
| **Metal Type** | 2 | RY | RY=Ring Yellow, WX=?, PY=Pendant Yellow, CY=Charm Yellow, BY=Bracelet Yellow, ET=Earrings, WP=?, etc. |
| **Karat/Purity** | 6 | 10.00 | 10K, 14K, 18K, etc. (as decimal) |
| **Gross Weight** | 6 | 5.10 | Grams or troy ounces |
| **Size/Condition** | 6 | MD9 | Ring size, condition codes, or N/A |
| **Qty** | 2 | 1 | Quantity of items |

### FINANCIAL & STATUS (Positions ~550-650)
| Field | Width | Example | Notes |
|-------|-------|---------|-------|
| **Insurance Flag** | 1 | R | R, W, C, etc. |
| **Insurance Amt** | 6 | 0.00 | Dollar amount |
| **Insured Amt** | 6 | 0.00 | Dollar amount |
| **Status Code** | 2 | B | Status indicator |
| **Quantity Flag** | 2 | 1 | Number code |
| **Fee 1** | 6 | 0.00 | Fee or charge |
| **Fee 2** | 6 | 0.00 | Fee or charge |
| **Loan/Purchase Amount** | 8 | 200.00 | Main financial amount |

### REFERENCE & ITEM SEQUENCE (Positions ~650-750)
| Field | Width | Example | Notes |
|-------|-------|---------|-------|
| **Control # (repeat)** | 8 | 117376 | Same as first field |
| **Clerk Initials** | 2 | JL | Person who processed |
| **Seq Number** | 3 | 1 | Item sequence (1st item, 2nd item, etc.) |
| **Control # (repeat 2)** | 8 | 117376 | Same as first field |
| **Address (repeat)** | 45 | 2096 RUTLAND ST OPA LOCKA FL33054-0000 | Customer address |
| **Item Line #** | 2 | 1 | Item number in transaction |

### FINAL FIELDS (Positions ~750+)
| Field | Width | Example | Notes |
|-------|-------|---------|-------|
| **Item Type (repeat)** | 14 | RING | Item type again |
| **Brand (repeat)** | 15 | NONE | Brand again |
| **Notes/Padding** | ~30 | (spaces) | Notes or padding |
| **Record Marker** | 1 | J | J=Jewelry transaction (O=Other/Tools, G=Firearms) |

---

## Data Model Summary

### Key Entities

**TRANSACTION**
- Control Number (PK)
- Transaction Date/Time
- Transaction Type (P=Pawn, B=Buy)
- Store Info (Name, Address, Phone)
- Clerk Initials
- Total Loan/Purchase Amount

**CUSTOMER** (Per Transaction)
- First, Middle, Last Name
- Date of Birth
- Gender
- Address (full: street, city, state, zip)
- Phone Number
- Employer/Business
- Physical Description (Height, Weight, Hair, Eyes)
- ID Type & Number

**INVENTORY ITEM** (Multiple per Transaction)
- Control Number (FK)
- Item Sequence Number
- Item Type (RING, WATCH, BRACELET, etc.)
- Brand/Maker
- Description
- Metal Type & Purity
- Weight
- Size
- Quantity
- Loan/Purchase Amount for This Item
- Status Code
- Record Type (J=Jewelry, O=Other, G=Firearms)

---

## Transaction Type Codes
- **P** = Pawn (Short-term loan)
- **B** = Buy (Outright purchase)

## Item Type Codes
- **J** = Jewelry
- **O** = Other items (Tools, Electronics, etc.)
- **G** = Firearms

## Metal Type Codes (Inferred)
- **RY** = Ring, Yellow Gold
- **BY** = Bracelet, Yellow Gold
- **PY** = Pendant, Yellow Gold
- **CY** = Charm, Yellow Gold
- **WX/WP/WD/WW** = Watch (various types)
- **ET** = Earrings
- **WO** = Wedding Ring (?)
- **X1** = Non-precious metal items

---

## Example Record Breakdown

```
117376LARRY'S ESTATE...3316 CLEVELAND AVE...FORT MYERS FL33901-(239)939-363320251008 10:17:00 P JUAN         ALBERTO      DEJESUS JR         19800625 MH 2096 RUTLAND ST OPA LOCKA FL33054-(305)570-6960 RAYS PRO PAINTING (   ) D22242180225 FL DRIVERS 5'11"210 BROWN BLACK RING NONE YELLOW 10K MANS CZ CLUSTER RING 5.1GRMS RY 10.00 5.10 MD9 1 R 0.00 0.00 B 1 0.00 0.00 200.00 117376 JL 1 117376 2096 RUTLAND ST OPA LOCKA FL33054-0000 1 RING NONE J
```

**Decoded:**
- Ticket #117376, Pawn transaction
- Pawned by Juan Alberto DeJesus Jr (DOB: 06/25/1980)
- Customer lives at 2096 Rutland St, Opa Locka, FL 33054
- Items: 1 Yellow 10K Ring (5.1 grams, size MD9)
- Loan Amount: $200.00
- Processed by clerk JL on 2025-10-08 at 10:17 AM

---

## Important Notes

1. **Multiple Items = Multiple Lines**: Each item in a transaction gets its own line, but they all share the same control number
2. **Fixed-Width Format**: Column positions are fixed - must be parsed by position ranges, not delimiters
3. **Padding**: Text fields are left-aligned and padded with spaces to their column width
4. **Phone Format**: Consistently formatted as (XXX) XXX-XXXX
5. **Dates**: YYYYMMDD format throughout
6. **Money**: Stored as decimal numbers (dollars.cents)
7. **Records End with J, O, or G**: Last character indicates item category

---

## Next Steps for Service

1. Create DTO classes that match this structure
2. Build a Fixed-Width Parser utility
3. Create DailyReport entity and repository
4. Implement import/parse use case
5. Add validation rules (e.g., valid date format, valid state codes)
