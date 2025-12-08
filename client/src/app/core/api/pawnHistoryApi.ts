import { http } from './http';

export interface PawnHistory {
  id: string;
  controlNumber: string;
  customerName: string;
  transactionDate: string;
  completedDate: string;
  type: 'PAWN' | 'PURCHASE';
  status: 'redeemed' | 'defaulted' | 'sold';
  amount: number;
  finalAmount?: number;
}

export const pawnHistoryApi = {
  getAll: async (): Promise<PawnHistory[]> => {
    // TODO: Replace with actual API endpoint when available
    // return http('/api/pawns/history');
    
    // Mock data
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      {
        id: '1',
        controlNumber: '099998',
        customerName: 'Alice Johnson',
        transactionDate: '2024-01-01T10:00:00Z',
        completedDate: '2024-01-25T15:30:00Z',
        type: 'PAWN',
        status: 'redeemed',
        amount: 300.00,
        finalAmount: 375.00
      },
      {
        id: '2',
        controlNumber: '099999',
        customerName: 'Bob Wilson',
        transactionDate: '2023-12-15T14:00:00Z',
        completedDate: '2024-01-20T12:00:00Z',
        type: 'PAWN',
        status: 'defaulted',
        amount: 800.00
      },
      {
        id: '3',
        controlNumber: '100000',
        customerName: 'Carol Davis',
        transactionDate: '2024-01-10T09:00:00Z',
        completedDate: '2024-01-12T16:00:00Z',
        type: 'PURCHASE',
        status: 'sold',
        amount: 1500.00,
        finalAmount: 1950.00
      }
    ];
  }
};
