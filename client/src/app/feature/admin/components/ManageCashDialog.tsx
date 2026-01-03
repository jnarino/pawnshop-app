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
import { tenderTypeApi, TenderType } from '@/app/core/api/tenderTypeApi';
import { salesApi } from '@/app/core/api/salesApi';
import { useAuthStore } from '@/app/core/store/useAuthStore';
import { toast } from 'sonner';

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
        alert("Money removed successfully");

        // Close dialog and finish session
        onOpenChange(false);
        useAuthStore.getState().clearUser();
        return;
      }

      // TODO: Implement API call for 'add' cash if needed
      const selectedMethod = availableMethods.find(m => m.id.toString() === paymentMethod);
      console.log('Adding cash (Mock):', {
        action,
        tenderTypeId: paymentMethod,
        tenderTypeName: selectedMethod?.name,
        reason,
        amount
      });

      // Reset form and close dialog on success
      resetForm();
      onOpenChange(false);
      toast.success('Cash added successfully');
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
    </Dialog>
  );
}
