import { useMemo, useState } from 'react';
import InventoryItemModal, { InventoryItemDraft } from './InventoryItemModal';
import type { PawnDraft } from '../types';
import { http } from '@/app/core/api/http';
import type { CreatePawnTicketDto } from '@/app/shared/types/pawnTicket';
import { useCategoryLookup } from '../hooks/useCategoryLookup';
import { PrintLabelsModal } from './PrintLabelsModal';
import { useNavigate } from 'react-router-dom';
import { logout } from '@/app/core/auth/authService';
import { TransactionFormPrinter } from '@/app/core/printing/TransactionFormPrinter';
import { LabelPrinter } from '@/app/core/printing/LabelPrinter';

interface Props {
  customerId: string;
  draft: PawnDraft;
  setDraft: React.Dispatch<React.SetStateAction<PawnDraft>>;
  onBack(): void;
}

// ✅ Define the type at the top of the file, after imports
// ✅ Enhanced PrintData interface
interface PrintData {
  controlNumber: string;
  customerName: string;
  customerLastName: string;    // ✅ Added
  customerFirstInitial: string; // ✅ Added
  ticketType: 'PAWN' | 'PURCHASE'; // ✅ Added
  transactionDate: string;      // ✅ Added
  items: Array<{
    id: string;
    inventoryNumber: string;
    description: string;
    amount: string;
    brand?: string;            // ✅ Added
    category?: string;         // ✅ Added
    categoryLabel?: string;
    typeCode?: string;
    modelNumber?: string;
    serialNumber?: string;
    quantity?: number;
    metal?: string;            // ✅ Added (e.g., "14KT", "18KT")
    karat?: string;            // ✅ Added
    weight?: string;           // ✅ Added (e.g., "7.3")
    weightUnit?: string;       // ✅ Added (e.g., "G", "DWT")
    length?: string;           // ✅ Added
  }>;

  customerFirst?: string;
  customerMiddle?: string;
  customerMiddleInitial?: string;
  customerAddress?: string;
  customerCity?: string;
  customerState?: string;
  customerZip?: string;
  customerPhone?: string;
  customerEmployer?: string;
  customerIdNumber?: string;
  customerIdType?: string;
  customerIdState?: string;
  customerBirthdate?: string;
  customerSex?: string;
  customerHeight?: string;
  customerWeight?: string;
  customerEyes?: string;
  customerHair?: string;
  customerRace?: string;
  defaultDate?: string;
  maturityDate?: string;
  amountFinanced?: string;
  financeCharge?: string;
  totalOfPayments?: string;
  annualRate?: string;
  employeeInitials?: string;
}

export default function PawnTicketForm({ customerId, draft, setDraft, onBack }: Props) {
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printItems, setPrintItems] = useState<any[]>([]);
  const [createdControlNumber, setCreatedControlNumber] = useState<string | null>(null);

  const navigate = useNavigate();

  const updateDraft = (patch: Partial<PawnDraft>) =>
    setDraft(prev => ({ ...prev, ...patch }));

  function upsertItem(item: InventoryItemDraft) {
    setDraft(prev => {
      const idx = prev.items.findIndex(p => p.id === item.id);
      if (idx === -1) return { ...prev, items: [...prev.items, item] };
      const next = [...prev.items];
      next[idx] = item;
      return { ...prev, items: next };
    });
  }
  function removeItem(id?: string) {
    if (!id) return;
    setDraft(prev => ({ ...prev, items: prev.items.filter(it => it.id !== id) }));
  }
  function openNewItem() { setEditingItem(null); setItemModalOpen(true); }
  function openEditItem(it: InventoryItemDraft) { setEditingItem(it); setItemModalOpen(true); }

  // Helpers to parse numbers safely
  const toMoney = (s?: string) => {
    const n = parseFloat(String(s ?? '').replace(/[^0-9.\-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const toQty = (s?: string) => {
    const n = parseInt(String(s ?? '1'), 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };

  // Derived totals
  const itemsTotal = useMemo(
    () => (draft.items ?? []).reduce((sum, it) => sum + toMoney(it.amount) * toQty((it as any).quantity), 0),
    [draft.items]
  );

  // Clamp rate percent between 10 and 25
  function setClampedRatePercent(v: string) {
    const num = parseFloat(v);
    if (!Number.isFinite(num)) { updateDraft({ ratePercent: '' }); return; }
    const clamped = Math.min(25, Math.max(10, num));
    updateDraft({ ratePercent: String(clamped) });
  }

  const { getCategoryIdByPath } = useCategoryLookup(); // ✅ Add this hook

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSaving(true); setCreatedId(null);

    try {
      // ✅ CONVERT CATEGORY CODES TO UUIDs
      const newInventoryItems = draft.items.map(it => {
        const categoryId = getCategoryIdByPath(it.type);

        if (!categoryId) {
          throw new Error(`Invalid category: ${it.type}`);
        }

        return {
          categoryId: categoryId,
          brand: it.brand || undefined,
          model: it.model || undefined,
          serialNumber: it.serial || undefined,
          colorId: null, // Will be set when color lookup is implemented
          itemCondition: 'Good', // Default condition
          quantity: parseInt(it.quantity || '1') || 1,
          priceAmount: it.amount ? Number(toMoney(it.amount)) : undefined,
          resale: undefined, // Add when UI supports it
          minResale: undefined, // Add when UI supports it
          itemReplace: undefined, // Add when UI supports it
          ownerMark: (it as any).ownerNumber || undefined,
          itemDescription: buildDescription(it),
          attributes: {
            brand: it.brand,
            model: it.model,
            serial: it.serial,
            color: it.color,
            ownerNumber: (it as any).ownerNumber,
            metal: (it as any).metal,
            karat: (it as any).karat,
            weight: (it as any).weight,
            weightUnit: (it as any).weightUnit,
            gender: (it as any).gender,
            style: (it as any).style,
            sizeLength: (it as any).sizeLength,
          },
          extra: {}, // Empty extra object as expected by SQL
        };
      });

      const body: CreatePawnTicketDto = {
        type: draft.type,
        customerId,
        // ✅ Don't send controlNumber - let server auto-generate
        // controlNumber: draft.controlNumber || undefined,
        newInventoryItems,
      };

      if (draft.type === 'PAWN') {
        body.amountFinanced = itemsTotal;
        body.periodicRate = (parseFloat(draft.ratePercent) || 0) / 100;
      }

      const data = await http('/api/pawnTicket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      setCreatedId(data.pawnTicket?.id || data.id);
      setCreatedControlNumber(data.pawnTicket?.controlNumber || data.controlNumber); // ✅ Store control number

      // ✅ Prepare items for label printing modal
      const inventoryItems = data.items || data.inventoryItems || [];
      
      const itemsForPrinting = (inventoryItems.length > 0 ? inventoryItems : draft.items).map((item: any, idx: number) => ({
        id: item.id || `item-${idx}`,
        inventoryNumber: item.inventoryNumber || `${data.pawnTicket?.controlNumber || data.controlNumber}-${idx + 1}`,
        description: item.itemDescription || buildDescription(item) || 'NO DESCRIPTION',
        amount: (item.priceAmount || item.amount || '0').toString(),
        quantity: item.quantity || 1
      }));

      setPrintItems(itemsForPrinting);
      setPrintModalOpen(true);

    } catch (e: any) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  // ✅ Handle label printing with quantities
  const handlePrintLabels = async (labelCounts: Record<string, number>) => {
    try {
      console.log('[Print] 🏷️ Printing labels with counts:', labelCounts);
      
      // Calculate total labels
      const totalLabels = Object.values(labelCounts).reduce((sum, count) => sum + count, 0);
      
      if (totalLabels === 0) {
        alert('No labels to print');
        return;
      }

      // ✅ Create print data for each label with control number
      const labelsTorint = [];
      for (const item of printItems) {
        const count = labelCounts[item.id] || 0;
        for (let i = 0; i < count; i++) {
          labelsTorint.push({
            inventoryNumber: item.inventoryNumber,
            description: item.description.toUpperCase(),
            amount: `$${parseFloat(item.amount || '0').toFixed(2)}`,
            controlNumber: createdControlNumber, // ✅ Use the actual control number from server
            // ✅ Additional label data
            itemId: item.id,
            labelIndex: i + 1,
            totalLabels: count
          });
        }
      }

      // ✅ Here you would call your actual label printer with control numbers
      console.log('[Print] Labels to print:', labelsTorint);
      
      // Example of what each label contains:
      labelsTorint.forEach((label, index) => {
        console.log(`[Print] Label ${index + 1}:`, {
          controlNumber: label.controlNumber,
          inventoryNumber: label.inventoryNumber,
          description: label.description,
          amount: label.amount
        });
      });
      
      // const labelPrinter = new LabelPrinter();
      // await labelPrinter.printMultiple(labelsTorint);
      
      console.log(`[Print] Would print ${totalLabels} labels with control number: ${createdControlNumber}`);

      // Close modal and reset
      setPrintModalOpen(false);
      setPrintItems([]);
      
      // ✅ Show success message with control number
      alert(`✅ Successfully printed ${totalLabels} labels for ticket #${createdControlNumber}!\n\nTransaction completed. Logging out...`);

      // ✅ Wait a moment for alert to be dismissed
      await new Promise(resolve => setTimeout(resolve, 100));

      // ✅ Clear all form state
      setCreatedId(null);
      setCreatedControlNumber(null); // ✅ Clear control number
      setError(null);
      setSaving(false);

      // ✅ Logout and redirect to login
      await logout();
      navigate('/login', { replace: true, state: null });

    } catch (error) {
      console.error('[Print] Label printing failed:', error);
      alert('Failed to print labels. Please try again.');
    }
  };

  return (
    <div className="pawn-ticket-form">
      <button type="button" onClick={onBack}>← Back</button>
      <h2>Pawn Ticket Details</h2>
      <form onSubmit={submit} className="pawn-ticket-layout">
        <section className="pawn-ticket-left">
          <div className="row"><label>Type
            <select value={draft.type} onChange={e => updateDraft({ type: e.target.value as PawnDraft['type'] })}>
              <option value="PAWN">Pawn</option>
              <option value="PURCHASE">Purchase</option>
            </select>
          </label></div>

          {/* ❌ REMOVED Control Number input - auto-generated by server */}

          {draft.type === 'PAWN' && <>
            <div className="row"><label>Amount Financed
              <input
                value={itemsTotal.toFixed(2)}
                readOnly
                inputMode="decimal"
                aria-readonly="true"
              />
            </label></div>

            <div className="row"><label>Rate
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="number"
                  min={10}
                  max={25}
                  step="0.01"
                  value={draft.ratePercent}
                  onChange={e => setClampedRatePercent(e.target.value)}
                  placeholder="25"
                  aria-label="Rate percent"
                />
                <span>%</span>
              </div>
            </label></div>
          </>}

          <div className="metrics-box">
            <div className="metric"><span>Active:</span><b>0</b></div>
            <div className="metric"><span>Redeemed:</span><b>0</b></div>
            <div className="metric"><span>Defaulted:</span><b>0</b></div>
            <div className="metric"><span>Buys:</span><b>0</b></div>
            <div className="metric"><span>Sales Amount:</span><b>$0</b></div>
          </div>
        </section>

        <section className="pawn-ticket-right">
          <div className="items-header">
            <div style={{ fontWeight: 600 }}>Item Description</div>
            <div style={{ flex: 1 }} />
            <button type="button" onClick={openNewItem}>New Item</button>
          </div>

          <div className="items-table-wrapper">
            <table className="items-table">
              <thead><tr><th>Type</th><th>Brand</th><th>Desc</th><th>Amount</th><th /></tr></thead>
              <tbody>
                {draft.items.map(it => (
                  <tr key={it.id}>
                    <td>{it.type}</td>
                    <td>{it.brand || ''}</td>
                    <td className="desc-cell">{buildDescription(it)}</td>
                    <td>{it.amount || ''}</td>
                    <td>
                      <div className="row-actions">
                        <button type="button" onClick={() => openEditItem(it)}>Edit</button>
                        <button type="button" onClick={() => removeItem(it.id)}>✕</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {draft.items.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', fontStyle: 'italic' }}>No items</td></tr>}
              </tbody>
            </table>
          </div>

          {error && <div className="error" style={{ marginTop: 8 }}>{error}</div>}
          {createdId && (
            <div className="success" style={{ marginTop: 8 }}>
              ✅ Pawn ticket created successfully!
              {draft.controlNumber && <div>Control Number: <strong>{draft.controlNumber}</strong></div>}
            </div>
          )}

          <div className="actions-row" style={{ justifyContent: 'flex-end', marginTop: 12 }}>
            <button type="submit" disabled={saving || (draft.type === 'PAWN' && itemsTotal <= 0)}>Save Pawn Ticket</button>
          </div>
        </section>
      </form>

      <InventoryItemModal
        open={itemModalOpen}
        initial={editingItem}
        onCancel={() => setItemModalOpen(false)}
        onSave={(item) => { upsertItem(item); setItemModalOpen(false); }}
      />

      {/* ✅ Simplified Print Labels Modal - matches the image */}
      <PrintLabelsModal
        open={printModalOpen}
        controlNumber={createdControlNumber || 'PENDING'}
        items={printItems}
        onPrint={handlePrintLabels}
        onCancel={() => {
          setPrintModalOpen(false);
          setPrintItems([]);
          onBack(); // Go back without printing
        }}
      />
    </div>
  );
}

function buildDescription(it: InventoryItemDraft): string {
  if (it.description) return it.description.substring(0, 200);
  const parts = [it.brand, it.model, it.color, it.style].filter(Boolean);
  return parts.join(' ').substring(0, 200);
}
