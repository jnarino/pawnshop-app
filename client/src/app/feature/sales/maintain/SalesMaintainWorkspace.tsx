import { useState } from 'react';

import { Button } from '@/components/ui/button';

import type { PawnTicketData, CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import { formatDate } from '@/lib/utils';
import { transformStones } from '@/app/shared/components/ElectronMenuBridge';
import { PawnTicketForm } from '../../pawns/maintain/PawnTicketForm';
import { MaintainSearch } from '@/app/shared/components/MaintainSearch';
import { CustomerRecord } from '../../_shared/customer';

const extractId = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && 'id' in value) {
    return (value as { id: string }).id || '';
  }
  return '';
};

function transformPawnTicketToFormData(pawnTicket: PawnTicketData) {


  const getBrandName = (brand: string | { id: string; name: string } | undefined): string => {
    if (!brand) return '';
    if (typeof brand === 'object' && brand.name) return brand.name;
    if (typeof brand === 'string') return brand;
    return '';
  };


  const transformedItems = (pawnTicket.items || []).map((item) => ({
    id: item.id,
    type: item.inventoryCategory?.id || item.legacyCategoryDescription || 'Item',
    categoryName: item.inventoryCategory?.name || item.legacyCategoryDescription || '',
    subcategoryId: item.inventorySubcategory?.id || '',
    subcategoryName: item.inventorySubcategory?.name || '',
    brandId: typeof item.brand === 'object' ? item.brand?.id : '',
    brandName: getBrandName(item.brand),
    model: item.model || '',
    serial: item.serialNumber || '',
    color: extractId(item.colorId),
    colorName: (item.colorId as any)?.name || '',
    condition: item.itemCondition || '',
    quantity: String(item.quantity || 1),
    amount: String(item.priceAmount || 0),
    resale: String(item.resale || 0),
    replace: String(item.itemReplace || 0),
    ownerNumber: item.ownerMark || '',
    description: item.itemDescription || '',
    metal: extractId(item.attributes?.metal),
    karat: extractId(item.attributes?.karat),
    weight: extractId(item.extra?.weight),
    weightUnit: extractId(item.extra?.weightUnit) || 'Grams',
    gender: extractId(item.extra?.gender),
    style: extractId(item.attributes?.style),
    sizeLength: extractId(item.extra?.size),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stones: transformStones(item.extra?.stones as any),
  }));

  const transactionType = pawnTicket.transactionType?.toUpperCase();

  return {
    customerId: pawnTicket.customerId,
    type: transactionType === 'PURCHASE' ? 'PURCHASE' as const : 'PAWN' as const,
    periodicRate: String(Math.round((pawnTicket.periodicRate || 0) * 100)),
    transactionDate: formatDate(pawnTicket.transactionDate),
    maturityDate: formatDate(pawnTicket.maturityDate),
    expirationDate: formatDate(pawnTicket.defaultDate),
    items: transformedItems
  };
}

function SalesMaintainWorkspaceContent() {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<PawnTicketData | null>(null);
  const modalTitle = selectedTicket ? `Pawn #${selectedTicket.controlNumber}` : 'Maintain sales';

  const handleSelectedCustomer = (customer: CustomerRecord) => {
    console.log({ customer });
    // search sales by customer id
  }

  const handleSearchControlNumber = (ticketNumber: string) => {
    console.log({ ticketNumber });
    // search sales by control number
  }

  const handleSearchByDateRange = (startDate: string, endDate: string) => {
    console.log({ startDate, endDate });
    // search sales by date range
  }
  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">{modalTitle}</h1>
      {!selectedTicket && (
        <div className="space-y-4">
          <MaintainSearch
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            selectedTicket={selectedTicket}
            setSelectedTicket={setSelectedTicket}
            handleSearchControlNumber={handleSearchControlNumber}
            handleSelectedCustomer={handleSelectedCustomer}
            handleSearchByDateRange={handleSearchByDateRange}
          />
        </div>
      )}

      {selectedTicket && (
        <div className="space-y-4">
          <PawnTicketForm
            mode="MODIFY"
            initialData={transformPawnTicketToFormData(selectedTicket)}
            controlNumber={selectedTicket.controlNumber}
            pawnTicket={selectedTicket}
            customer={selectedCustomer || undefined}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Back to results</Button>
            <Button onClick={() => { /* TODO: Implement update pawn endpoint */ }}>Update Pawn</Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function SalesMaintainWorkspace() {
  return (
    <SalesMaintainWorkspaceContent />
  );
}
