import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Customer } from '@/app/feature/pawns/types';

export interface ForfeitFormData {
    dateRange: {
        from: string;
        to: string;
    };
    ticketNumber: string;
}

import { pawnTicketApi, TicketByControlNumber } from '@/app/core/api/pawnTicketApi';

export const useForfeitForm = () => {
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [items, setItems] = useState<TicketByControlNumber[]>([]);
    const [loading, setLoading] = useState(false);

    const today = new Date();
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    const form = useForm<ForfeitFormData>({
        defaultValues: {
            dateRange: {
                from: localToday,
                to: localToday
            },
            ticketNumber: ''
        }
    });

    const submitForfeit = async (data: ForfeitFormData) => {
        setLoading(true);
        try {
            if (data.ticketNumber) {
                const results = await pawnTicketApi.findByControlNumber(data.ticketNumber.trim());
                setItems(results);
            } else {
                setItems([]);
            }
        } catch (error) {
            console.error(error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    return {
        form,
        submitForfeit,
        customer,
        setCustomer,
        items,
        loading
    };
};
