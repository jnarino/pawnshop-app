export enum StoreTransactionTypeId {
  // Unknown/adjustments
  ADJUSTMENT_STORE = 1, // ASF
  ADJUSTMENT_SALE = 2, // ASL

  // Buy / Pawn
  BUY = 3, // B
  VOIDED_BUY = 4, // BV
  PAWN_LOAN = 5, // P
  PAWN_DEFAULTED = 6, // PD
  PAWN_PAYMENT = 7, // PPP
  PAWN_REDEMPTION = 8, // PPU
  VOIDED_PAWN = 9, // PV

  // Retail sales
  RETAIL_SALE = 10, // SS
  VOIDED_SALE = 11, // SSV

  // Layaway
  LAYAWAY_DEPOSIT = 12, // SL
  LAYAWAY_DEFAULTED = 13, // SLD
  LAYAWAY_PAYMENT = 14, // SLP
  LAYAWAY_PICKUP = 15, // SLU
  VOIDED_LAYAWAY = 16, // SLV
  UNDO_LAYAWAY_PAYMENT = 17, // SLX

  // Repairs
  REPAIR_DEPOSIT = 18, // SF
  REPAIR_PICKUP = 19, // SFU
  VOIDED_REPAIR = 20, // SFV

  // Cash management
  EMPLOYEE_BALANCE = 21, // EB
  DEPOSIT_FROM_MAIN = 22, // MA
  MAIN_BALANCE = 23, // MB
  CASH_ADDED_MAIN = 24, // MI
  CASH_OUT_MAIN = 25, // MO
  WITHDRAWAL_FROM_BANK = 26, // MZ

  // Other
  COMMISSION_OTHER = 27 // T
}
