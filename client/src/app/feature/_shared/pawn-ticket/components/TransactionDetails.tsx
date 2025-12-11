import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';

interface TransactionDetailsProps {
  type: 'PAWN' | 'PURCHASE';
  periodicRate: string;
  transactionDate: string;
  maturityDate: string;
  expirationDate: string;
  totalValue: number;
  onTypeChange: (value: 'PAWN' | 'PURCHASE') => void;
  onPeriodicRateChange: (value: string) => void;
  onTransactionDateChange: (value: string) => void;
  onMaturityDateChange: (value: string) => void;
  onExpirationDateChange: (value: string) => void;
}

export function TransactionDetails({
  type,
  periodicRate,
  transactionDate,
  maturityDate,
  expirationDate,
  totalValue,
  onTypeChange,
  onPeriodicRateChange,
  onTransactionDateChange,
  onMaturityDateChange,
  onExpirationDateChange,
}: TransactionDetailsProps) {
  return (
    <Card className="border-2 mb-6">
      <CardHeader className="bg-slate-50 border-b py-4">
        <CardTitle className="text-lg font-semibold">Transaction Details</CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid gap-6">
        {/* Radio Group */}
        <div className="flex flex-col gap-3">
          <Label>Transaction Type</Label>
          <RadioGroup
            value={type}
            onValueChange={(value) => onTypeChange(value as 'PAWN' | 'PURCHASE')}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PAWN" id="r-pawn" />
              <Label htmlFor="r-pawn">Pawn (Loan)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PURCHASE" id="r-buy" />
              <Label htmlFor="r-buy">Buy</Label>
            </div>
          </RadioGroup>
        </div>

        {type === 'PAWN' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Amount Finance</Label>
              <div className="text-2xl font-bold">
                ${totalValue.toFixed(2)}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={periodicRate}
                onChange={(e) => onPeriodicRateChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Date In</Label>
              <DatePicker
                value={transactionDate}
                onChange={(date) => onTransactionDateChange(date || '')}
              />
            </div>
            <div className="space-y-2">
              <Label>Maturity Date</Label>
              <DatePicker
                value={maturityDate}
                onChange={(date) => onMaturityDateChange(date || '')}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <DatePicker
                value={expirationDate}
                onChange={(date) => onExpirationDateChange(date || '')}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Purchase Value</Label>
            <div className="text-2xl font-bold">
              ${totalValue.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Total value of items being purchased by the store.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
