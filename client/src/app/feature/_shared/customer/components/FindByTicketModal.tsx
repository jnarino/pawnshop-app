import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2, AlertCircle } from 'lucide-react';

interface FindByTicketModalProps {
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onFind: (ticketNumber: string) => void;
}

export function FindByTicketModal({ open, loading, error, onClose, onFind }: FindByTicketModalProps) {
  const [ticketNumber, setTicketNumber] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (ticketNumber.trim() && !loading) {
      onFind(ticketNumber.trim());
    }
  }, [ticketNumber, loading, onFind]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setTicketNumber('');
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Find Customer by Ticket</DialogTitle>
          <DialogDescription>
            To find a customer by ticket ID, enter the ticket number or scan the ticket.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>
                You can type the ticket number manually or use a barcode scanner to scan the ticket.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="ticket-number">Ticket Number</Label>
              <Input
                id="ticket-number"
                type="text"
                placeholder="Enter ticket number..."
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                autoFocus
                disabled={loading}
                className="text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={!ticketNumber.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding...
                </>
              ) : (
                'Find'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
