export interface PawnTicketItem {
  id: string;
  categoryId?: string;
  inventorySubcategoryId?: string;
  inventoryCategory?: { id: string; name: string };
  inventorySubcategory?: { id: string; name: string };
  status: string;
  quantity: number;
  brand?: string | { id: string; name: string };
  model?: string;
  serialNumber?: string;
  colorId?: string | { id: string; name: string };
  itemCondition?: string;
  ownerMark?: string | null;
  itemDescription?: string;
  priceAmount: number;
  resale: number;
  minResale?: number;
  itemReplace?: number;
  extra?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
  legacyCategoryDescription?: string | null;
  legacyBrandColorDescription?: string;
  inventoryNumber?: string;
}

export interface PawnTicketData {
  id: string;
  controlNumber: string;
  transactionType: 'PAWN' | 'PURCHASE';
  customerId: string;
  amountFinanced: number | null;
  purchaseTradeValue: number | null;
  periodicRate: number;
  clerkUsername: string;
  transactionDate: string;
  maturityDate: string;
  defaultDate: string;
  createdDate: string
  pawnStatus: string;
  itemIds: string[];
  items: PawnTicketItem[];
  currentCharges?: number;
  redemptionAmount?: number;
  apr?: number;
  originalPawnAmount?: number;
  serviceCharge?: number;
  statusPawn?: string;
  totalOfPayments?: number;
}

export interface CustomerData {
  readonly id: string;
  readonly firstName: string;
  readonly middleName?: string | null;
  readonly lastName: string;
  readonly secondLastName?: string;
  readonly idType?: string | null;
  readonly idNumber?: string | null;
  readonly phoneNumber?: string | null;
  readonly streetAddress?: string | null;
  readonly city?: string | null;
  readonly zipCode?: string | null;
  readonly stateUs?: string | null;
  readonly idState?: string | null;
  readonly dateOfBirth?: string | null;
  readonly sex?: string | null;
  readonly race?: string | null;
  readonly height?: string | null;
  readonly weight?: string | null;
  readonly eyeColor?: string | null;
  readonly hairColor?: string | null;
  readonly employerName?: string | null;
}
