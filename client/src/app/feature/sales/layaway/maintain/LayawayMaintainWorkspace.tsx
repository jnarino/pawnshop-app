import { useState } from 'react';

import type { CustomerData } from '@/app/feature/_shared/types/pawnTicket';
import { MaintainSearch, ScopeFilter } from '@/app/shared/components/MaintainSearch';
import { apiToRecordLoose, CustomerRecord } from '@/app/feature/_shared/customer';
import { layawayApi } from '@/app/core/api/layawayApi';
import { Button } from '@/components/ui/button';

import { http } from '@/app/core/api/http';
import LayawayWorkspace from '../LayawayWorkspace';
import { LayawayList } from './LayawayList';
import { Loader2 } from 'lucide-react';

export const statusOptionsMap = {
  'defaulted': 'DEFAULTED',
  'active': 'LAYAWAY',
  'sold': 'SOLD',
  'voided': 'VOIDED',
}

const today = new Date();
const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

const dates = {
  from: '1990-01-01',
  to: localToday
}

function LayawayMaintainWorkspaceContent() {
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState<ScopeFilter>('active');
  const [layaways, setLayaways] = useState<any[]>([]);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(null);

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);
  const modalTitle = selectedTicket ? `Layaway` : 'Maintain layaways';
  const [showTicketTable, setShowTicketTable] = useState(false);

  const handleLayawaysResponse = (layaways: any[]) => {
    setLayaways(layaways);
    setShowTicketTable(true);
    setLoading(false);
  }

  const getLayawayByCustomer = async (customerId: string) => {
    setLoading(true);
    const layaways = await layawayApi.getByCustomer(customerId);
    handleLayawaysResponse(layaways);
  }

  const getLayawayByControlNumber = async (controlNumber: string) => {
    setLoading(true);
    try {
      const layaway = await layawayApi.findByControlNumber(controlNumber);
      handleLayawaysResponse(layaway ? [layaway] : []);
    } catch (error) {
      console.error('Error fetching layaway by control number:', error);
      setLoading(false);
    }
  }

  const getLayawayByDateRange = async (startDate: string, endDate: string, status?: string) => {
    setLoading(true);
    const layaways = await layawayApi.getByDateRange(startDate, endDate, status);
    handleLayawaysResponse(layaways);
  }

  const handleSelectedCustomer = (customer: CustomerRecord) => {
    if (customer.id) {

      getLayawayByCustomer(customer.id);
    }
    setSelectedCustomer(customer);
  }

  const handleSearchControlNumber = (ticketNumber: string) => {
    setSelectedCustomer(null);
    getLayawayByControlNumber(ticketNumber);
  }

  const handleSearchByDateRange = (startDate: string, endDate: string, status?: string) => {
    setSelectedCustomer(null);
    getLayawayByDateRange(startDate, endDate, status);
  }

  const getCustomerInformationById = async (customerId: string) => {
    if (!customerId) return;
    try {
      const customerDto = await http(`/api/customer/${customerId}`);
      if (customerDto) {
        const customerRecord = apiToRecordLoose(customerDto);
        setCurrentCustomer({
          id: customerRecord.id || '',
          firstName: customerRecord.firstName,
          middleName: customerRecord.middleName,
          lastName: customerRecord.lastName,
          secondLastName: (customerRecord as any).secondLastName,
          idType: customerRecord.idType,
          idNumber: customerRecord.idNumber,
          phoneNumber: customerRecord.phoneNumber,
          streetAddress: customerRecord.streetAddress,
          city: customerRecord.city,
          zipCode: customerRecord.zipCode,
          stateUs: customerRecord.stateUs,
          idState: (customerRecord as any).idState || customerRecord.idState,
          dateOfBirth: customerRecord.dateOfBirth,
          sex: customerRecord.sex,
          race: customerRecord.race,
          height: customerRecord.height,
          weight: customerRecord.weight,
          eyeColor: customerRecord.eyeColor,
          hairColor: customerRecord.hairColor,
          employerName: customerRecord.employerName
        });
      }
    } catch (err) {
      console.warn('Failed to fetch customer for ticket reprint:', err);
    }
  }

  const handleOpenTicket = (row: any): void => {
    setSelectedTicket({ ...row, typeName: statusOptionsMap[row.status] });
    getCustomerInformationById(row?.customerId || row?.customer?.id);
  };

  return (
    <>
      <h1 className="text-2xl font-extrabold mb-2.5">{modalTitle}</h1>
      {!selectedTicket && (
        <div className="space-y-4">
          <MaintainSearch
            handleSearchControlNumber={handleSearchControlNumber}
            handleSelectedCustomer={handleSelectedCustomer}
            handleSearchByDateRange={handleSearchByDateRange}
            setShowTicketTable={setShowTicketTable}
            initialDates={dates}
            isLayawayMaintain
          />
        </div>
      )}

      {loading && !selectedTicket && (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading layaways...</p>
          </div>
        </div>
      )}

      {showTicketTable && !loading && !selectedTicket && (
        <div className="border rounded-lg mt-8">
          {selectedCustomer && (
            <div className="p-3 flex items-center justify-between text-sm text-muted-foreground">
              <span>Layaways for {selectedCustomer?.firstName || ''} {selectedCustomer?.lastName || ''}</span>
              <span className="text-xs">Status: {statusOptionsMap[status]}</span>
            </div>
          )}
          <LayawayList layaways={layaways} showCustomer={!!selectedCustomer} loading={loading} handleOpenTicket={handleOpenTicket} />
        </div>
      )}


      {selectedTicket && (
        <div className="space-y-4">
          <LayawayWorkspace initialTicket={selectedTicket} mode="VIEW" isLayaway={true} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Back to results</Button>
          </div>
        </div>
      )}
    </>
  );
}

export default function LayawayMaintainWorkspace() {
  return (
    <LayawayMaintainWorkspaceContent />
  );
}
