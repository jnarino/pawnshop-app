import React from 'react';
import type { TabKey, SelectedPawnTicket } from '../hooks/usePaymentFlow';
import type { Customer as CustomerDto } from '../../customer/types';
import CustomerInfoTab from './CustomerInfoTab';
import AdditionalInfoTab from './AdditionalInfoTab';
import ViewPawnTab from './ViewPawnTab';
import LocatePawnsTab from './LocatePawnsTab';
import MakePaymentTab from './MakePaymentTab';

interface Props {
    activeTab: TabKey;
    customerId: string | null;
    customer: CustomerDto | null;
    selectedPawn: SelectedPawnTicket | null;
    onCustomerChange: (customer: CustomerDto | null) => void;
    onCustomerSelected: (id: string) => void;
    onTabChange: (tab: TabKey) => void;
    onPawnSelected: (pawn: SelectedPawnTicket) => void;
    onViewPawn: (pawn: SelectedPawnTicket) => void;
    onPaymentComplete: () => void;
}

export default function PaymentTabContent({
    activeTab,
    customerId,
    customer,
    selectedPawn,
    onCustomerChange,
    onCustomerSelected,
    onTabChange,
    onPawnSelected,
    onViewPawn,
    onPaymentComplete
}: Props) {
    switch (activeTab) {
        case 'customer':
            return (
                <CustomerInfoTab
                    customer={customer}
                    onCustomerChange={onCustomerChange}
                    onCustomerSelected={(id) => {
                        onCustomerSelected(id);
                        onTabChange('locatePawns');
                    }}
                    onCreateNew={onCustomerSelected}
                />
            );

        case 'additional':
            return (
                <AdditionalInfoTab
                    customerId={customerId}
                    onBack={() => onTabChange('customer')}
                />
            );

        case 'viewPawn':
            return selectedPawn && customerId ? (
                <ViewPawnTab
                    pawnTicket={selectedPawn}
                    onBack={() => onTabChange('locatePawns')}
                    onMakePayment={() => onTabChange('makePayment')}
                />
            ) : null;

        case 'locatePawns':
            return customerId ? (
                <LocatePawnsTab
                    customerId={customerId}
                    onBack={() => onTabChange('customer')}
                    onPawnSelected={onPawnSelected}
                    onViewPawn={onViewPawn}
                />
            ) : null;

        case 'makePayment':
            return selectedPawn && customerId ? (
                <MakePaymentTab
                    pawnTicket={selectedPawn}
                    customerId={customerId}
                    onBack={() => onTabChange('locatePawns')}
                    onPaymentComplete={onPaymentComplete}
                />
            ) : null;

        default:
            return null;
    }
}
