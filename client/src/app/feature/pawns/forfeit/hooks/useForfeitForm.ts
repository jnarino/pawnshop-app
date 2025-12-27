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

export const useForfeitForm = () => {
    const [customer, setCustomer] = useState<Customer | null>(null);

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

    const submitForfeit = (data: ForfeitFormData) => {
        console.log('Forfeit Form Data:', data);
    };

    return {
        form,
        submitForfeit,
        customer,
        setCustomer
    };
};
