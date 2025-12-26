import React from 'react';
import ConfirmModal from '@/app/shared/components/ConfirmModal';

interface Props {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function PaymentCancelModal({ open, onConfirm, onCancel }: Props) {
  return (
    <ConfirmModal
      open={open}
      title="Cancel Payment"
      message="Are you sure you want to cancel the payment process?"
      confirmText="Yes, cancel"
      cancelText="No, keep working"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
