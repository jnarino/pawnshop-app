import { useState } from 'react';
import PawnTicketForm from './PawnTicketForm';

interface Props { customerId: string; onBack(): void; onGoPreviousItems(): void; }

export default function NewPawnTab({ customerId, onBack, onGoPreviousItems }: Props) {
  const [showForm, setShowForm] = useState(true); // placeholder for toggling between item add / summary later
  return (
    <div className="pawn-panel">
      <div className="panel-header">
        <button type="button" onClick={onBack}>← Customer</button>
        <h2 style={{ margin: 0 }}>New Pawn</h2>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onGoPreviousItems}>Previous Items →</button>
      </div>
      {showForm && <PawnTicketForm customerId={customerId} onBack={onBack} />}
    </div>
  );
}
