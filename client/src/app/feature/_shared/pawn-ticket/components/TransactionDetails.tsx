import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';

interface TransactionDetailsProps {
  readonly isViewMode: boolean;
  readonly type: 'PAWN' | 'PURCHASE';
  readonly periodicRate: string;
  readonly transactionDate: string;
  readonly maturityDate: string;
  readonly expirationDate: string;
  readonly forfeitDate: string;
  readonly totalValue: number;
  readonly serviceCharge: string;
  readonly redemptionAmount: string;
  readonly totalOfPayments: string;
  readonly disabled?: boolean;
  readonly clerkUsername?: string;
  readonly controlNumber?: string;
  readonly onTypeChange: (value: 'PAWN' | 'PURCHASE') => void;
  readonly onPeriodicRateChange: (value: string) => void;
  readonly onTransactionDateChange: (value: string) => void;
  readonly onMaturityDateChange: (value: string) => void;
  readonly onExpirationDateChange: (value: string) => void;
  readonly onForfeitDateChange: (value: string) => void;
}

export function TransactionDetails({
  isViewMode,
  type,
  periodicRate,
  transactionDate,
  expirationDate,
  forfeitDate,
  totalValue,
  serviceCharge,
  redemptionAmount,
  totalOfPayments,
  disabled = false,
  clerkUsername,
  controlNumber,
  onTypeChange,
  onPeriodicRateChange,
  onTransactionDateChange,
  onExpirationDateChange,
  onForfeitDateChange,
}: TransactionDetailsProps) {
  return (
    <Card className="border-2 mb-6">
      <CardHeader className="bg-slate-50 border-b py-4">
        <CardTitle className="text-lg font-semibold">Transaction Details</CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid gap-6">
        {/* Radio Group */}
        <div className="flex gap-3">
          <div className="flex flex-col gap-3">
            <Label>Transaction type</Label>
            <RadioGroup
              value={type}
              onValueChange={(value) => onTypeChange(value as 'PAWN' | 'PURCHASE')}
              className="flex gap-4"
              disabled={disabled}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PAWN" id="r-pawn" disabled={disabled} />
                <Label htmlFor="r-pawn">Pawn (Loan)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="PURCHASE" id="r-buy" disabled={disabled} />
                <Label htmlFor="r-buy">Buy</Label>
              </div>
            </RadioGroup>
          </div>
          {isViewMode && (
            <>
              <p><strong>Ticket number:</strong> {controlNumber}</p>
              <p><strong>Entered by:</strong> {clerkUsername}</p>
            </>
          )}
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
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Date In</Label>
              <DatePicker
                value={transactionDate}
                onChange={(date) => onTransactionDateChange(date || '')}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label>Expiration Date</Label>
              <DatePicker
                value={expirationDate}
                onChange={(date) => onExpirationDateChange(date || '')}
                disabled={disabled}
              />
            </div>

            {isViewMode && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="rate">Service charge</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={serviceCharge}
                    onChange={(e) => onPeriodicRateChange(e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Redemption price</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={redemptionAmount}
                    onChange={(e) => onPeriodicRateChange(e.target.value)}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Forfeit</Label>
                  <DatePicker
                    value={forfeitDate}
                    onChange={(date) => onForfeitDateChange(date || '')}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Total paid</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={totalOfPayments}
                    onChange={(e) => onPeriodicRateChange(e.target.value)}
                    disabled={disabled}
                  />
                </div>
              </>
            )}
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
