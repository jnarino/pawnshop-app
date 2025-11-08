import React from 'react';

interface Props {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm(): void;
  onCancel(): void;
}

export default function ConfirmModal({
  open,
  title = 'Confirm',
  message,
  confirmText = 'Yes, cancel',
  cancelText = 'No, keep working',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}
    >
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 8, padding: 16, width: 420, boxShadow: '0 10px 24px rgba(0,0,0,0.25)' }}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ marginTop: 8 }}>{message}</p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" onClick={onCancel}>{cancelText}</button>
          <button type="button" onClick={onConfirm} style={{ background: '#c62828', color: '#fff' }}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}