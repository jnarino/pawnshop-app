import React, { useEffect, useMemo, useState } from 'react';
import PawnTicketForm from './PawnTicketForm';
import { InventoryItemDraft } from './InventoryItemModal';

interface Props { customerId: string; onBack(): void; onGoPreviousItems(): void; }

export default function NewPawnTab({ customerId, onBack, onGoPreviousItems }: { customerId: string; onBack(): void; onGoPreviousItems(): void }) {
  const [showForm, setShowForm] = useState(true); // placeholder for toggling between item add / summary later
  const [items, setItems] = useState<InventoryItemDraft[]>([]); // if already present, keep your existing one
  const [form, setForm] = useState({ periodicRate: 0 }); // assume form state is managed here

  // Helpers to parse numbers
  const money = (s?: string) => {
    const n = parseFloat(String(s ?? '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const qty = (s?: string) => {
    const n = parseInt(String(s ?? '1'), 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };

  // Derived: sum of item amounts x quantity
  const itemsTotal = useMemo(
    () => (items ?? []).reduce((sum, it) => sum + money(it.amount) * qty(it.quantity), 0),
    [items]
  );

  // Derived: percent string for UI (form.periodicRate is decimal)
  const ratePercent = useMemo(
    () => (form.periodicRate ? (Number(form.periodicRate) * 100).toString() : '0'),
    [form.periodicRate]
  );

  // keep any existing amountFinanced state in sync (if you have one)
  const [amountFinanced, setAmountFinanced] = useState<number>(0);
  useEffect(() => { setAmountFinanced(itemsTotal); }, [itemsTotal]);

  // when building payloads/schedules use decimalRate
  const decimalRate = useMemo(() => {
    const n = parseFloat(ratePercent);
    return Number.isFinite(n) ? n / 100 : 0;
  }, [ratePercent]);

  return (
    <div className="pawn-panel">
      <div className="panel-header">
        <button type="button" onClick={onBack}>← Customer</button>
        <h2 style={{ margin: 0 }}>New Pawn</h2>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onGoPreviousItems}>Previous Items →</button>
      </div>
      {showForm && <PawnTicketForm customerId={customerId} onBack={onBack} />}
      {/* removed duplicate finance inputs that were rendered under the items section */}
      {/* ...existing footer buttons if any... */}
    </div>
  );
}
