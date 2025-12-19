import { useState } from 'react';
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

type CashAction = 'add' | 'remove';
type PaymentMethod = 'cash' | 'debit' | 'discover' | 'visa';

interface ManageCashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: 'Cash' },
  { value: 'debit', label: 'Debit' },
  { value: 'discover', label: 'Discover' },
  { value: 'visa', label: 'Visa' },
];

export default function ManageCashDialog({ open, onOpenChange }: ManageCashDialogProps) {
  const [action, setAction] = useState<CashAction>('add');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim() || !amount) return;

    setLoading(true);
    try {
      // TODO: Implement API call to manage cash
      console.log('Managing cash:', { action, paymentMethod, reason, amount });
      
      // Reset form and close dialog on success
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to manage cash:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAction('add');
    setPaymentMethod('cash');
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
            <Select value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method..." />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
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
