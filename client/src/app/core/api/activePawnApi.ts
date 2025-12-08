import { http } from './http';

export interface ActivePawn {
  id: string;
  controlNumber: string;
  customerName: string;
  transactionDate: string;
  maturityDate: string;
  amountFinanced: number;
  totalOfPayments: number;
  status: string;
  itemCount: number;
}

export const activePawnApi = {
  getAll: async (): Promise<ActivePawn[]> => {
    // TODO: Replace with actual API endpoint when available
    // return http('/api/pawns/active');
    
    // Mock data for now
    await new Promise(resolve => setTimeout(resolve, 1000));
    return [
      {
        id: '1',
        controlNumber: '100001',
        customerName: 'John Smith',
        transactionDate: '2024-01-15T10:00:00Z',
        maturityDate: '2024-02-14T10:00:00Z',
        amountFinanced: 500.00,
        totalOfPayments: 625.00,
        status: 'active',
        itemCount: 2
      },
      {
        id: '2',
        controlNumber: '100002',
        customerName: 'Jane Doe',
        transactionDate: '2024-01-20T14:00:00Z',
        maturityDate: '2024-02-19T14:00:00Z',
        amountFinanced: 1200.00,
        totalOfPayments: 1500.00,
        status: 'active',
        itemCount: 1
      }
    ];
  }
};
