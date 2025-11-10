import React, { useState } from 'react';
import type { Customer as CustomerDto } from '../../customer/types';
import { useNavigate } from 'react-router-dom';
import PaymentTabsNavigation from './PaymentTabsNavigation';
import PaymentTabContent from './PaymentTabContent';
import PaymentCancelModal from './PaymentCancelModal';
import { usePaymentFlow } from '../hooks/usePaymentFlow';

export default function PaymentFlowContainer() {
    const navigate = useNavigate();
    const [cancelOpen, setCancelOpen] = useState(false);

    const {
        customerId,
        setCustomerId,
        customer,
        setCustomer,
        selectedPawn,
        setSelectedPawn,
        activeTab,
        setActiveTab,
        resetFlow
    } = usePaymentFlow();

    const handleCancel = () => {
        setCancelOpen(false);
        resetFlow();
        navigate('/', { replace: true });
    };

    const handlePawnSelected = (pawn: any) => {
        setSelectedPawn(pawn);
        setActiveTab('makePayment');
    };

    return (
        <div className="payment-flow">
            <PaymentTabsNavigation
                activeTab={activeTab}
                onTabChange={setActiveTab}
                customerId={customerId}
                selectedPawn={selectedPawn}
                onCancel={() => setCancelOpen(true)}
            />

            <PaymentTabContent
                activeTab={activeTab}
                customerId={customerId}
                customer={customer}
                selectedPawn={selectedPawn}
                onCustomerChange={setCustomer}
                onCustomerSelected={setCustomerId}
                onTabChange={setActiveTab}
                onPawnSelected={handlePawnSelected}
                onViewPawn={(pawn) => {
                    setSelectedPawn(pawn);
                    setActiveTab('viewPawn');
                }}
                onPaymentComplete={() => {
                    setSelectedPawn(null);
                    setActiveTab('locatePawns');
                }}
            />

            <PaymentCancelModal
                open={cancelOpen}
                onConfirm={handleCancel}
                onCancel={() => setCancelOpen(false)}
            />
        </div>
    );
}
