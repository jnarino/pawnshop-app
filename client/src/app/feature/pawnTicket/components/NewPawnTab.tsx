import React from 'react';
import PawnTicketForm from './PawnTicketForm';
import type { PawnDraft } from '../types';

interface Props {
  customerId: string;
  draft: PawnDraft;
  setDraft: React.Dispatch<React.SetStateAction<PawnDraft>>;
  onBack(): void;
  onGoPreviousItems(): void;
}

export default function NewPawnTab({ customerId, draft, setDraft, onBack, onGoPreviousItems }: Props) {
  return (
    <div className="pawn-panel">
      <div className="panel-header" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <button type="button" onClick={onBack}>← Customer</button>
        <h2 style={{ margin: 0, flex: 1 }}>New Pawn</h2>
        <button type="button" onClick={onGoPreviousItems}>Previous Items →</button>
      </div>

      <PawnTicketForm customerId={customerId} draft={draft} setDraft={setDraft} onBack={onBack} />
    </div>
  );
}
