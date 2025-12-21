import { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { pawnTicketPaymentApi, PawnTicketPayment } from '@/app/core/api/pawnTicketPaymentApi';

interface PaymentHistoryModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly pawnTicketId: string;
}

export function PaymentHistoryModal({ open, onClose, pawnTicketId }: PaymentHistoryModalProps) {
  const [payments, setPayments] = useState<PawnTicketPayment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = useCallback(async () => {
    if (!pawnTicketId || !open) return;

    try {
      setLoading(true);
      setError(null);
      const data = await pawnTicketPaymentApi.getPaymentHistory(pawnTicketId);
      setPayments(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payment history');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [pawnTicketId, open]);

  useEffect(() => {
    if (open) {
      loadPayments();
    }
  }, [open, loadPayments]);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatMoney = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading payment history...</p>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Payment Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No payment history found
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment, index) => (
                    <TableRow key={`${payment.pawnTicketId}-${index}`}>
                      <TableCell className="font-medium">
                        {formatMoney(payment.principalPaid)}
                      </TableCell>
                      <TableCell>
                        {payment.clerkUserId || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {formatDate(payment.paymentDate)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
