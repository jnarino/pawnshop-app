import { useState } from 'react';
import { useForm } from 'react-hook-form';

export interface ForfeitFormData {
    dateRange: {
        from: string;
        to: string;
    };
    ticketNumber: string;
}

import { pawnTicketApi, TicketByControlNumber } from '@/app/core/api/pawnTicketApi';

export const useForfeitForm = () => {
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
                const { from, to } = data.dateRange;
                if (from && to) {
                    const results = await pawnTicketApi.findByDateRange(from, to);
                    setItems(results);
                } else {
                    setItems([]);
                }
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
        items,
        loading
    };
};
