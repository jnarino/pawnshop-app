import React from 'react';

interface Props {
  customerId: string | null;
  onBack: () => void;
}

export default function AdditionalInfoTab({ customerId, onBack }: Props) {
  return (
    <div className="payment-panel placeholder">
      <h2>Additional Customer Info</h2>
      <p>Extended customer profile information will be displayed here.</p>
      <button type="button" onClick={onBack}>← Back to Customer</button>
    </div>
  );
}
