import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';
import ConfirmModal from './ConfirmModal';
import { useNavigate } from 'react-router-dom';

export const CancelButton = ({ onCancelTransaction }: { onCancelTransaction?: () => void }) => {
    const navigate = useNavigate();

    const [cancelModalOpen, setCancelModalOpen] = useState(false)

    const confirmCancelTransaction = useCallback(() => {
        setCancelModalOpen(false);
        onCancelTransaction?.();
        navigate('/', { replace: true });
    }, [navigate, onCancelTransaction]);

    return (<>
        <Button variant="destructive" onClick={() => setCancelModalOpen(true)}>
            Cancel Transaction
        </Button>
        <ConfirmModal
            open={cancelModalOpen}
            title="Cancel Transaction"
            message="Are you sure you want to cancel the transaction? All unsaved changes will be lost."
            confirmText="Yes, cancel"
            cancelText="No, keep working"
            onConfirm={confirmCancelTransaction}
            onCancel={() => setCancelModalOpen(false)}
        />
    </>
    )
}