import { useState, useEffect } from 'react';
import { tenderTypeApi, TenderType } from '@/app/core/api/tenderTypeApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TenderMethod {
  id: string;
  name: string;
  amount: string;
  tenderTypeId: number;
}

interface Props {
  open: boolean;
  totalAmount: number;
  allowedTenderTypes: number[];
  onCancel: () => void;

  onDone: (tenders: TenderMethod[], gunLogData?: { nicsNumber: string; comments: string; gunFee: number }) => void;
  readonly history?: {
    tenders: any[];
    change: number;
  };
  readonly showDeposit?: boolean;
  readonly showGunProcessingFee?: boolean;
}

export default function PaymentMethodModal({
  open,
  totalAmount,
  allowedTenderTypes = [],
  onCancel,
  onDone,
  history,
  showDeposit,
  showGunProcessingFee
}: Props) {
  const [tenders, setTenders] = useState<TenderMethod[]>([]);
  const [availableTypes, setAvailableTypes] = useState<TenderType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>(String((totalAmount * 0.1).toFixed(2)));

  const [gunProcessingFee, setGunProcessingFee] = useState<string>("5.00");
  const [nicsNumber, setNicsNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [comments, setComments] = useState('Gun was picked up by the same customer');

  // Calculate effective total based on props
  const calculateEffectiveTotal = () => {
    let total = totalAmount;
    if (showGunProcessingFee) {
      total += parseFloat(gunProcessingFee) || 0;
    }
    return total;
  };

  const effectiveTotal = calculateEffectiveTotal();

  const [totalAmountToPay, setTotalAmountToPay] = useState(showDeposit ? totalAmount * 0.1 : effectiveTotal);

  useEffect(() => {
    if (showDeposit) {
      setTotalAmountToPay(Number(depositAmount));
    } else {
      setTotalAmountToPay(calculateEffectiveTotal());
    }
  }, [depositAmount, gunProcessingFee, showDeposit, totalAmount, showGunProcessingFee]);

  useEffect(() => {
    if (open) {
      loadTenderTypes();
    }
  }, [open]);

  const loadTenderTypes = async () => {
    setLoadingTypes(true);
    try {
      const types = await tenderTypeApi.list();
      const filteredTypes = types.filter(t => allowedTenderTypes.includes(t.id));
      setAvailableTypes(filteredTypes);

      if (filteredTypes.length > 0) {
        const cashType = filteredTypes.find(t => t.name === 'CASH') || filteredTypes[0];
        setTenders([{
          id: '1',
          name: cashType.name,
          amount: totalAmountToPay.toFixed(2),
          tenderTypeId: cashType.id
        }]);
      }
    } catch (error) {
      console.error('Failed to load tender types', error);
    } finally {
      setLoadingTypes(false);
    }
  };

  const updateTenderAmount = (id: string, amount: string) => {
    setTenders(prev => prev.map(t =>
      t.id === id ? { ...t, amount } : t
    ));
  };

  const addTender = () => {
    const usedTypeIds = new Set(tenders.map(t => t.tenderTypeId));
    const nextAvailableType = availableTypes.find(t => !usedTypeIds.has(t.id));

    if (!nextAvailableType) return;

    const newTender: TenderMethod = {
      id: Date.now().toString(),
      name: nextAvailableType.name,
      amount: (totalAmountToPay - getTotalTendered()).toFixed(2),
      tenderTypeId: nextAvailableType.id
    };
    setTenders(prev => [...prev, newTender]);
  };

  const removeTender = (id: string) => {
    if (tenders.length <= 1) return; // Keep at least one
    setTenders(prev => prev.filter(t => t.id !== id));
  };

  const updateTenderType = (id: string, name: string) => {
    const typeObj = availableTypes.find(t => t.name === name);
    if (!typeObj) return;

    setTenders(prev => prev.map(t =>
      t.id === id ? { ...t, name, tenderTypeId: typeObj.id } : t
    ));
  };

  const getTotalTendered = () => {
    return tenders.reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0);
  };

  const getChange = () => {
    return Math.max(0, getTotalTendered() - totalAmountToPay);
  };

  if (!open) return null;

  console.log({ totalAmount })

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payment Method Selection</DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {history && (
            <div className="mb-6 bg-slate-50 p-4 rounded-md border text-sm">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                Payment history
              </h4>
              <div className="space-y-1">
                {history.tenders.map((t, i) => {
                  const typeName = availableTypes.find(type => type.id === t.tenderTypeId)?.name || t.name || 'Unknown';
                  return (
                    <div key={i} className="flex justify-between text-muted-foreground">
                      <span>{typeName}:</span>
                      <span>${Number(t.amount).toFixed(2)}</span>
                    </div>
                  )
                })}
                <div className="flex justify-between font-medium pt-2 border-t mt-2">
                  <span>Change Due:</span>
                  <span>${Number(history.change).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-col items-center justify-center mb-8 bg-muted/30 p-4 rounded-lg border border-dashed">
            <Label className="text-muted-foreground mb-1 uppercase text-xs tracking-wider">Total Payment Required</Label>
            <div className="text-3xl font-bold tracking-tight text-primary">
              ${effectiveTotal.toFixed(2)}
            </div>
            {showGunProcessingFee && (
              <div className="flex flex-col items-center gap-2 mt-4 w-full">
                <Label className="text-muted-foreground mb-1 uppercase text-xs tracking-wider">Gun Processing Fee</Label>
                <div className="relative w-32">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    value={gunProcessingFee}
                    onChange={(e) => setGunProcessingFee(e.target.value)}
                    className="pl-8 text-right font-mono"
                  />
                </div>

                <div className="w-full mt-4 space-y-4 border-t pt-4">
                  <div className="grid gap-2 text-left">
                    <Label htmlFor="nicsNumber" className="text-xs font-semibold">NICS Number <span className="text-red-500">*</span></Label>
                    <Input
                      id="nicsNumber"
                      value={nicsNumber}
                      onChange={(e) => setNicsNumber(e.target.value)}
                      placeholder="Enter NICS Number"
                      className="bg-background"
                    />
                  </div>
                  <div className="grid gap-2 text-left">
                    <Label htmlFor="notes" className="text-xs font-semibold">Notes:</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter notes..."
                      className="bg-background min-h-[80px]"
                    />
                  </div>
                  <div className="grid gap-2 text-left">
                    <Label htmlFor="comments" className="text-xs font-semibold">Comment:</Label>
                    <Input
                      id="comments"
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Enter comments..."
                      className="bg-background"
                    />
                  </div>
                </div>
              </div>
            )}
            {showDeposit && (
              <div className="flex flex-col items-center gap-2 mt-2">
                <Label className="text-muted-foreground mb-1 uppercase text-xs tracking-wider">Deposit</Label>
                <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="pl-8 text-right font-mono"
                />
              </div>
            )}
            {showDeposit && Number(depositAmount) >= totalAmount && (
              <p className="text-xs text-destructive font-medium mt-1">
                Deposit must be less than total amount
              </p>
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-xs font-medium uppercase text-muted-foreground flex justify-between items-center px-1">
              <span>Payment Methods</span>
              <span className="text-[10px]">{tenders.length} Used</span>
            </Label>

            {tenders.map((tender, idx) => (
              <div key={tender.id} className="grid grid-cols-[1.5fr_1fr_auto] gap-3 items-start animate-in fade-in slide-in-from-left-4 duration-300">
                <Select
                  value={tender.name}
                  onValueChange={(value) => updateTenderType(tender.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingTypes ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : (
                      availableTypes.map(type => {
                        // Disable if used in another row
                        const isUsed = tenders.some(t => t.tenderTypeId === type.id && t.id !== tender.id);
                        return (
                          <SelectItem key={type.id} value={type.name} disabled={isUsed}>
                            {type.name}
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>

                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    value={tender.amount}
                    onChange={(e) => updateTenderAmount(tender.id, e.target.value)}
                    className="pl-8 text-right font-mono"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTender(tender.id)}
                  disabled={tenders.length <= 1}
                  className={cn("h-10 w-10 text-muted-foreground hover:text-destructive", tenders.length <= 1 && "opacity-0")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {tenders.length < availableTypes.length && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTender}
                className="w-full border-dashed"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Split Payment
              </Button>
            )}
          </div>

          <div className="mt-8 space-y-3 bg-muted p-4 rounded-md">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total Tendered:</span>
              <span className="font-mono font-medium">${getTotalTendered().toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-muted-foreground/20">
              <span className="font-medium">Change Due:</span>
              <span className={cn(
                "font-mono font-bold text-lg",
                getChange() > 0 ? "text-green-600" : "text-muted-foreground"
              )}>
                ${getChange().toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => onDone(tenders, showGunProcessingFee ? {
              nicsNumber,
              comments,
              gunFee: parseFloat(gunProcessingFee) || 0
            } : undefined)}
            disabled={
              getTotalTendered() < totalAmountToPay ||
              (showDeposit ? Number(depositAmount) >= totalAmount : false) ||
              (showGunProcessingFee && !nicsNumber)
            }
            className={cn("w-full sm:w-auto", getTotalTendered() >= totalAmountToPay ? "bg-green-600 hover:bg-green-700" : "")}
          >
            Process {!!history ? "Return" : "Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
