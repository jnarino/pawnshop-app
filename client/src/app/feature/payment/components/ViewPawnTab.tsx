import { useState, useCallback } from 'react';
import { PawnTicketForm } from '@/app/feature/_shared/pawn-ticket';
import type { InventoryItemDraft } from '@/app/feature/_shared/pawn-ticket/components/InventoryItemModal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon } from 'lucide-react';
import { usePawnPrint } from '@/app/feature/pawns/hooks/usePawnPrint';
import { pawnTicketApi } from '@/app/core/api/pawnTicketApi';
import { http } from '@/app/core/api/http';
import { apiToRecordLoose, type Customer } from '@/app/feature/_shared/customer';
import printerIcon from '@/assets/icons/printer.svg';

interface ViewPawnTabProps {
  readonly pawnTicket: any;
  readonly onBack: () => void;
  readonly onMakePayment: () => void;
}

const mockPawnData: {
  customerId: string;
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  items: InventoryItemDraft[];
} = {
  customerId: 'customer-123',
  type: 'PAWN',
  periodicRate: '25',
  transactionDate: '2025-01-07',
  maturityDate: '2025-02-06',
  expirationDate: '2025-03-08',
  items: [
    {
      id: '1',
      type: 'Electronics',
      categoryName: 'Laptop',
      brandName: 'Apple',
      model: 'MacBook Pro 16"',
      serial: 'C02XK0XAJG5H',
      color: 'Space Gray',
      condition: 'Excellent',
      quantity: '1',
      amount: '1200',
      resale: '1800',
      replace: '2500',
      ownerNumber: 'MB',
      description: 'M1 Max chip, 32GB RAM, 1TB SSD'
    },
    {
      id: '2',
      type: 'Jewelry',
      categoryName: 'Gold Necklace',
      brandName: 'Tiffany & Co',
      model: 'Elsa Peretti',
      serial: '',
      color: 'Gold',
      condition: 'Very Good',
      quantity: '1',
      amount: '800',
      resale: '1200',
      replace: '1600',
      ownerNumber: 'EP',
      description: '18K gold, 16 inch chain with pendant'
    }
  ]
};

export function ViewPawnTab({ pawnTicket, onBack, onMakePayment }: ViewPawnTabProps) {
  const { printTransactionForm, printLabels, isFormPrinting } = usePawnPrint();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isPrintingLabels, setIsPrintingLabels] = useState(false);

  const handlePrint = useCallback(async () => {
    if (!pawnTicket?.controlNumber) {
      console.error('No control number available');
      return;
    }

    setIsPrinting(true);
    try {
      const tickets = await pawnTicketApi.findByControlNumber(pawnTicket.controlNumber);
      if (!tickets || tickets.length === 0) {
        console.error('Ticket not found');
        return;
      }

      const ticket = tickets[0];
      const customerDto = await http(`/api/customer/${ticket.customerId}`);
      const customer = apiToRecordLoose(customerDto) as Customer;

      const items = mockPawnData.items.map(item => ({
        type: item.type,
        brand: item.brandName,
        model: item.model,
        serial: item.serial,
        description: item.description,
        amount: item.amount,
        quantity: item.quantity,
        ownerNumber: item.ownerNumber
      }));

      await printTransactionForm({ ticket, customer, items });
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsPrinting(false);
    }
  }, [pawnTicket, printTransactionForm]);

  const handlePrintLabels = useCallback(async () => {
    if (!pawnTicket?.controlNumber) {
      console.error('No control number available');
      return;
    }

    setIsPrintingLabels(true);
    try {
      const labelCounts: Record<string, number> = {};
      mockPawnData.items.forEach(item => {
        if (item.id) {
          labelCounts[item.id] = 1;
        }
      });

      await printLabels(
        pawnTicket.controlNumber,
        mockPawnData.items.map(item => ({
          id: item.id || '',
          inventoryNumber: item.ownerNumber || '',
          description: item.description || `${item.brandName || ''} ${item.model || ''}`.trim(),
          amount: item.amount || '0',
          quantity: Number(item.quantity) || 1
        })),
        labelCounts
      );
    } catch (error) {
      console.error('Print labels failed:', error);
    } finally {
      setIsPrintingLabels(false);
    }
  }, [pawnTicket, printLabels]);

  const handlePayHistory = () => {
    console.log('Pay History clicked');
  };

  const handleDueDates = () => {
    console.log('Due Dates clicked');
  };

  return (
    <div className="p-6">
      <PawnTicketForm
        mode="VIEW"
        initialData={mockPawnData}
      />
      <div className="flex justify-center gap-4 mt-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="secondary"
              size="lg"
              disabled={isPrinting || isFormPrinting || isPrintingLabels}
              className="px-8 flex items-center gap-2"
            >
              <img src={printerIcon} alt="Print" className="w-5 h-5 brightness-0" />
              {isPrinting || isFormPrinting || isPrintingLabels ? 'Printing...' : 'Print'}
              <ChevronDownIcon className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handlePrint} disabled={isPrinting || isFormPrinting}>
                Print Ticket
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrintLabels} disabled={isPrintingLabels}>
                Print Labels
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="secondary"
          size="lg"
          onClick={handlePayHistory}
          className="px-8"
        >
          Pay History
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleDueDates}
          className="px-8"
        >
          Due Dates
        </Button>
      </div>
    </div>
  );
}
