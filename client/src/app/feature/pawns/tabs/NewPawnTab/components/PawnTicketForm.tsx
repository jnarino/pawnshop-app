import { useMemo, useState } from 'react';
import InventoryItemModal, { InventoryItemDraft } from './InventoryItemModal';
import type { PawnDraft } from '../types';
import type { CreatePawnTicketDto } from '@/app/shared/types/pawnTicket';
import { useCategoryLookup } from '../hooks/useCategoryLookup';
import { usePawnTicketCreation } from '../hooks/usePawnTicketCreation';
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
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printData, setPrintData] = useState<PrintData | null>(null);

  const navigate = useNavigate();
  const { createPawnTicket, getCustomerInfo, loading: saving } = usePawnTicketCreation();
  const [error, setError] = useState<string | null>(null);

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
    // eslint-disable-next-line prefer-named-capture-group
    const n = Number.parseFloat(String(s ?? '').replace(/[^0-9.-]/g, ''));
    return Number.isFinite(n) ? n : 0;
  };
  const toQty = (s?: string) => {
    const n = Number.parseInt(String(s ?? '1'), 10);
    return Number.isFinite(n) && n > 0 ? n : 1;
  };

  // Derived totals
  const itemsTotal = useMemo(
    () => (draft.items ?? []).reduce((sum, it) => sum + toMoney(it.amount) * toQty((it as any).quantity), 0),
    [draft.items]
  );

  // Clamp rate percent between 10 and 25
  function setClampedRatePercent(v: string) {
    const num = Number.parseFloat(v);
    if (!Number.isFinite(num)) { updateDraft({ ratePercent: '' }); return; }
    const clamped = Math.min(25, Math.max(10, num));
    updateDraft({ ratePercent: String(clamped) });
  }

  const { getCategoryIdByPath } = useCategoryLookup(); // ✅ Add this hook

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setCreatedId(null);

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
          quantity: Number.parseInt(it.quantity || '1', 10) || 1,
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
        body.periodicRate = (Number.parseFloat(draft.ratePercent) || 0) / 100;
      }

      // ✅ Use hook instead of direct HTTP call
      const data = await createPawnTicket(body);
      setCreatedId(data.id);

      // ✅ Use hook to fetch customer info
      const customer = await getCustomerInfo(customerId);

      // ✅ Helper to convert null to undefined
      const nullToUndefined = (val: string | null | undefined): string | undefined => 
        val === null ? undefined : val;

      // ✅ Prepare print data with enhanced info
      const printDataPrepared: PrintData = {
        controlNumber: data.controlNumber ?? '',
        customerName: `${customer.firstName} ${customer.lastName}`,
        customerFirst: customer.firstName,
        customerMiddle: nullToUndefined(customer.middleName),
        customerMiddleInitial: customer.middleName ? customer.middleName[0] : undefined,
        customerLastName: customer.lastName,
        customerFirstInitial: customer.firstName?.charAt(0) ?? '',
        ticketType: draft.type,
        transactionDate: data.transactionDate ?? new Date().toISOString(),
        maturityDate: data.maturityDate ?? null,
        customerAddress: nullToUndefined(customer.streetAddress),
        customerCity: nullToUndefined(customer.city),
        customerState: nullToUndefined(customer.stateUs),
        customerZip: nullToUndefined(customer.zipCode),
        customerPhone: nullToUndefined(customer.phoneNumber ?? customer.cellPhone),
        customerEmployer: nullToUndefined(customer.employerName) ?? '',
        customerIdNumber: nullToUndefined(customer.idNumber),
        customerIdType: nullToUndefined(customer.idType),
        customerIdState: nullToUndefined(customer.idState),
        customerBirthdate: nullToUndefined(customer.dateOfBirth),
        customerSex: nullToUndefined(customer.sex),
        customerHeight: nullToUndefined(customer.height),
        customerWeight: nullToUndefined(customer.weight),
        customerEyes: nullToUndefined(customer.eyeColor),
        customerHair: nullToUndefined(customer.hairColor),
        customerRace: nullToUndefined(customer.race),
        defaultDate: data.defaultDate ?? null,
        items: draft.items.map((draftItem: InventoryItemDraft, idx: number) => {
          return {
            id: `draft-${idx}`,
            inventoryNumber: `${data.controlNumber ?? 'PENDING'}-${idx + 1}`,
            description: buildDescription(draftItem).toUpperCase(),
            amount: (draftItem.amount ?? '0').toString(),
            brand: draftItem.brand ?? '',
            category: draftItem.type ?? '',
            categoryLabel: draftItem.type ?? '',
            karat: (draftItem as any).karat ?? '',
            weight: (draftItem as any).weight ?? '',
            weightUnit: (draftItem as any).weightUnit ?? '',
            quantity: Number.parseInt((draftItem as any).quantity || '1', 10),
            typeCode: (draftItem as any).metal ?? '',
            modelNumber: draftItem.model ?? '',
            serialNumber: draftItem.serial ?? ''
          };
        })
      };

      // ✅ IMMEDIATELY print transaction form (don't wait for user)
      console.log('[Print] 📄 Auto-printing transaction form...');
      transactionPrinter.print(printDataPrepared).catch(err => {
        console.error('[Print] Transaction form print failed:', err);
        // Don't block the flow - form print is non-critical
      });

      // ✅ Store print data for modal
      setPrintData(printDataPrepared);

      // ✅ Open print modal (for labels only)
      setPrintModalOpen(true);

    } catch (e: any) {
      setError(e.message || 'Save failed');
    }
  }

  // ✅ Initialize printers
  const transactionPrinter = new TransactionFormPrinter();
  const labelPrinter = new LabelPrinter();

  // ✅ Handle ONLY label printing (form already printed)
  const handlePrint = async () => {
    if (!printData) return;

    try {
      // Print item labels (GoDEX thermal printer)
      console.log('[Print] 🏷️ Printing labels...');
      const labelResult = await labelPrinter.print(printData);
      if (!labelResult.success) {
        throw new Error(labelResult.error || 'Failed to print labels');
      }

      // Close modal
      setPrintModalOpen(false);
      
      // ✅ Clear all state before logout
      setPrintData(null);
      setCreatedId(null);
      setError(null);

      // Show success message
      alert('✅ Transaction completed!\n\n🏷️ Labels printed\n\nLogging out...');

      // ✅ Wait a moment for alert to be dismissed
      await new Promise(resolve => setTimeout(resolve, 100));

      // Logout and redirect
      await logout();
      
      // Route back to login without forcing a full reload so the form stays interactive
      navigate('/login', { replace: true, state: null });
    } catch (err) {
      console.error('[Print] Error:', err);
      alert(`Failed to print labels: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="pawn-ticket-form">
      <button type="button" onClick={onBack}>← Back</button>
      <h2>Pawn Ticket Details</h2>
      <form onSubmit={submit} className="pawn-ticket-layout">
        <section className="pawn-ticket-left">
          <div className="row">
            <label>
              Type
              {' '}
              <select value={draft.type} onChange={e => updateDraft({ type: e.target.value as PawnDraft['type'] })}>
                <option value="PAWN">Pawn</option>
                <option value="PURCHASE">Purchase</option>
              </select>
            </label>
          </div>

          {/* ❌ REMOVED Control Number input - auto-generated by server */}

          {draft.type === 'PAWN' && <>
            <div className="row">
              <label>
                Amount Financed
                {' '}
                <input
                  value={itemsTotal.toFixed(2)}
                  readOnly
                  inputMode="decimal"
                  aria-readonly="true"
                />
              </label>
            </div>

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

      {/* ✅ Print Labels Modal */}
      {printData && (
        <PrintLabelsModal
          open={printModalOpen}
          controlNumber={printData.controlNumber}
          customerName={printData.customerName}
          items={printData.items}
          onPrint={handlePrint}
          onCancel={() => setPrintModalOpen(false)}
        />
      )}
    </div>
  );
}

function buildDescription(it: InventoryItemDraft): string {
  if (it.description) return it.description.substring(0, 200);
  const parts = [it.brand, it.model, it.color, it.style].filter(Boolean);
  return parts.join(' ').substring(0, 200);
}
