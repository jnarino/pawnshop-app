import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePicker } from '@/components/ui/date-picker';

interface DueDatePeriod {
  period: number;
  date: string;
  serviceCharge: number;
  redemption: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  pawnAmount: number;
  transactionDate: string;
  periodicRate: number;
}

export function DueDateCalculatorModal({
  open,
  onClose,
  pawnAmount,
  transactionDate,
  periodicRate
}: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const [chargesForDate, setChargesForDate] = useState('');
  const [calculatedDate, setCalculatedDate] = useState('');
  const [serviceCharges, setServiceCharges] = useState<number | null>(null);
  const [redemptionAmount, setRedemptionAmount] = useState<number | null>(null);

  const periods = generateDueDatePeriods(pawnAmount, transactionDate, periodicRate);

  const handleCalculate = useCallback(() => {
    if (!calculatedDate) {
      setServiceCharges(null);
      setRedemptionAmount(null);
      setSelectedDate('');
      return;
    }

    const selectedDateTime = new Date(calculatedDate).getTime();
    const startDateTime = new Date(transactionDate).getTime();
    const daysDiff = Math.ceil((selectedDateTime - startDateTime) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) {
      setServiceCharges(null);
      setRedemptionAmount(null);
      setSelectedDate('');
      return;
    }

    const periodNumber = Math.max(1, Math.ceil(daysDiff / 30));
    const selectedPeriod = periods.find(p => p.period === periodNumber) || periods[periods.length - 1];
    
    setServiceCharges(selectedPeriod.serviceCharge);
    setRedemptionAmount(selectedPeriod.redemption);
    setSelectedDate(selectedPeriod.date);
  }, [calculatedDate, periods, transactionDate]);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>View Due Dates</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Payment Schedule</h3>
            <ScrollArea className="h-[500px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Service Charge</TableHead>
                    <TableHead className="text-right">Redemption</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periods.map((period) => (
                    <TableRow
                      key={period.period}
                      className={selectedDate === period.date ? 'bg-muted' : 'cursor-pointer hover:bg-muted/50'}
                      onClick={() => {
                        setSelectedDate(period.date);
                        setCalculatedDate(period.date.split('T')[0]);
                        setServiceCharges(period.serviceCharge);
                        setRedemptionAmount(period.redemption);
                      }}
                    >
                      <TableCell>{period.period}</TableCell>
                      <TableCell>{formatDate(period.date)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(period.serviceCharge)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(period.redemption)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>

          <div className="space-y-6">
            <h3 className="font-semibold text-lg">Calculator</h3>
            
            <div className="space-y-4 p-6 border rounded-lg bg-muted/30">
              <div className="space-y-2">
                <Label>Pawn Amount</Label>
                <div className="text-2xl font-bold">{formatCurrency(pawnAmount)}</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="calculatedDate">Charges for this date</Label>
                <DatePicker
                  value={calculatedDate}
                  onChange={(date) => setCalculatedDate(date || '')}
                  placeholder="Select a date"
                />
              </div>

              <Button 
                onClick={handleCalculate}
                className="w-full"
                size="lg"
              >
                Calculate
              </Button>

              <div className="pt-4 space-y-3 border-t">
                <div className="flex justify-between items-center">
                  <Label className="text-base">Service Charges:</Label>
                  <span className="text-xl font-semibold">
                    {serviceCharges !== null ? formatCurrency(serviceCharges) : '-'}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t">
                  <Label className="text-base">Redemption Amount:</Label>
                  <span className="text-2xl font-bold text-primary">
                    {redemptionAmount !== null ? formatCurrency(redemptionAmount) : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function generateDueDatePeriods(
  pawnAmount: number,
  transactionDate: string,
  periodicRate: number
): DueDatePeriod[] {
  const periods: DueDatePeriod[] = [];
  const startDate = new Date(transactionDate);

  for (let i = 1; i <= 24; i++) {
    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + (i * 30));

    const serviceCharge = (pawnAmount * periodicRate) * i;
    const redemption = pawnAmount + serviceCharge;

    periods.push({
      period: i,
      date: dueDate.toISOString(),
      serviceCharge,
      redemption
    });
  }

  return periods;
}
