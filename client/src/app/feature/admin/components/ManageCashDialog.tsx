import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarInput } from '@/components/ui/dollar-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { tenderTypeApi, TenderType } from '@/app/core/api/tenderTypeApi';
import { salesApi } from '@/app/core/api/salesApi';
import { useAuthStore } from '@/app/core/store/useAuthStore';
import { toast } from 'sonner';
import { AlertModal } from '@/app/shared/components/AlertModal';

type CashAction = 'add' | 'remove';

interface ManageCashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManageCashDialog({ open, onOpenChange }: ManageCashDialogProps) {
  const [action, setAction] = useState<CashAction>('add');
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<TenderType[]>([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [isFromBank, setIsFromBank] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadPaymentMethods();
    }
  }, [open]);

  const loadPaymentMethods = async () => {
    setLoadingMethods(true);
    try {
      const types = await tenderTypeApi.list();
      const activeTypes = types.filter(t => t.active);
      setAvailableMethods(activeTypes);

      // Set default to CASH if found
      const cashType = activeTypes.find(t => t.name === 'CASH');
      if (cashType) {
        setPaymentMethod(cashType.id.toString());
      } else if (activeTypes.length > 0) {
        setPaymentMethod(activeTypes[0].id.toString());
      }
    } catch (error) {
      console.error('Failed to load payment methods:', error);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim() || !amount) return;

    setLoading(true);
    try {
      if (action === 'remove') {
        const now = new Date();
        const miamiFormatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/New_York',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hourCycle: 'h23'
        });
        const parts = miamiFormatter.formatToParts(now);
        const findPart = (p: string) => parts.find(part => part.type === p)?.value;
        const localIsoString = `${findPart('year')}-${findPart('month')}-${findPart('day')}T${findPart('hour')}:${findPart('minute')}:${findPart('second')}.000Z`;

        const payload = {
          amount: parseFloat(amount),
          note: reason,
          occurredAt: localIsoString
        };

        await salesApi.removeCashFromMainDrawer(payload);

        // Success dialog
        setAlertMessage("Money removed successfully");

        // We will delay closing until alert is dismissed, but since AlertModal is non-blocking in this flow logic,
        // we might want to just show alert and rely on user closing it.
        // However, the original logic closed the dialog right after alert.
        // We'll set a callback to close dialog when alert is closed?
        // For simplicity: setAlertMessage and handle external close logic or rework flow. 
        // Actually, let's keep it simple: Show alert. When alert closes (onOpenChange), we can check a flag or just close manually.
        // Better yet: just Toast for success? User specifically requested Modal.
        // Let's use AlertMessage. When user clicks OK, we can optionally perform an action.
        // But for minimal invasiveness, I'll just set message. The user closes the AlertModal, and we need to close the main dialog?
        // The original code: alert() -> BLOCK -> onOpenChange(false).
        // New code: setAlertMessage() -> RENDER -> User clicks OK -> onOpenChange(false).

        // I will implement a standard AlertModal usage, but since I cannot easily wire a callback to "OK" purely via state boolean in one go without extra state,
        // I'll add an `onClose` prop to my AlertModal logic or just use a useEffect or specific handler.
        // Wait, AlertModal I defined has onOpenChange.
        // I will add a 'success-remove' type logic or just use a simple state. 
        // For now, I'll set the message. But I also need to close the main dialog.
        // If I close main dialog immediately, AlertModal might unmount if it's inside Dialog? No, AlertModal is likely portal-ed.
        // But if ManageCashDialog unmounts, AlertModal unmounts if it is a child.
        // So I must NOT close ManageCashDialog until AlertModal is closed.
        return;
      }

      // TODO: Implement API call for 'add' cash if needed
      const selectedMethod = availableMethods.find(m => m.id.toString() === paymentMethod);

      if (action === 'add') {
        const now = new Date();
        const miamiFormatter = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/New_York',
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hourCycle: 'h23'
        });
        const parts = miamiFormatter.formatToParts(now);
        const findPart = (p: string) => parts.find(part => part.type === p)?.value;
        const localIsoString = `${findPart('year')}-${findPart('month')}-${findPart('day')}T${findPart('hour')}:${findPart('minute')}:${findPart('second')}.000Z`;

        const payload = {
          amount: parseFloat(amount),
          transactionTenderName: selectedMethod?.name || 'CASH',
          isFromBank,
          note: reason,
          occurredAt: localIsoString
        };

        await salesApi.addMoneyToMainDrawer(payload);

        toast.success('Cash added successfully');
        resetForm();
        onOpenChange(false);
        return;
      }
    } catch (error) {
      console.error('Failed to manage cash:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAction('add');
    // Keep current payment method or reset to CASH if available
    const cashType = availableMethods.find(t => t.name === 'CASH');
    if (cashType) {
      setPaymentMethod(cashType.id.toString());
    }
    setReason('');
    setAmount('');
    setIsFromBank(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  const isFormValid = reason.trim() && amount && parseFloat(amount) > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Cash</DialogTitle>
          <DialogDescription>
            Add or remove cash from the register.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Action Radio Group */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Action</Label>
            <RadioGroup
              value={action}
              onValueChange={(value) => setAction(value as CashAction)}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="action-add" />
                <Label htmlFor="action-add" className="cursor-pointer">Add</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="remove" id="action-remove" />
                <Label htmlFor="action-remove" className="cursor-pointer">Remove</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder={loadingMethods ? "Loading methods..." : "Select payment method..."} />
              </SelectTrigger>
              <SelectContent>
                {availableMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id.toString()}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">Reason</Label>
            <Input
              id="reason"
              placeholder="Enter reason..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-sm font-medium">Amount</Label>
            <DollarInput
              id="amount"
              value={amount}
              onChange={setAmount}
              placeholder="0.00"
            />
          </div>

          {/* Add from Bank Checkbox */}
          {action === 'add' && (
            <div className="flex items-center space-x-2 py-2">
              <Checkbox
                id="from-bank"
                checked={isFromBank}
                onCheckedChange={(checked) => setIsFromBank(checked as boolean)}
              />
              <Label
                htmlFor="from-bank"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Adding money from Bank
              </Label>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={!isFormValid || loading}
          className="w-full"
          variant={action === 'remove' ? 'destructive' : 'default'}
        >
          {loading ? 'Processing...' : action === 'add' ? 'Add' : 'Remove'}
        </Button>
      </DialogContent>
      <AlertModal
        open={!!alertMessage}
        onOpenChange={(open) => {
          if (!open) {
            setAlertMessage(null);
            // If it was the success message for remove, we proceed to close everything
            if (action === 'remove' && !loading) { // simplistic check
              onOpenChange(false);
              useAuthStore.getState().clearUser();
            }
          }
        }}
        message={alertMessage}
      />
    </Dialog>
  );
}
