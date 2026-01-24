
export type LayawayHistoryItemDto = {
  occurredAt: string;
  transactionType: string;
  clerkUsername: string;
  amount: number;
};

export type LayawayHistoryResponseDto = LayawayHistoryItemDto[];
