import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CustomerRecord } from '../mappers';

interface SearchResultsModalProps {
  open: boolean;
  empty: boolean;
  fromScan: boolean;
  canAddFromScan: boolean;
  results: CustomerRecord[];
  loading: boolean;
  error: string | null;
  onSelect(id: string, r: CustomerRecord): void;
  onAddFromScan(): void;
  onClose(): void;
}

export function SearchResultsModal({
  open,
  empty,
  fromScan,
  canAddFromScan,
  results,
  loading,
  error,
  onSelect,
  onAddFromScan,
  onClose
}: SearchResultsModalProps) {
  const isCompact = !loading && empty;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className={isCompact ? 'max-w-md' : 'max-w-3xl'}>
        <DialogHeader>
          <DialogTitle>{isCompact ? 'Customer Search' : 'Customer Search Results'}</DialogTitle>
          {error && (
            <DialogDescription className="text-destructive">
              {error}
            </DialogDescription>
          )}
        </DialogHeader>

        {loading && (
          <div className="py-8 text-center text-muted-foreground">
            Searching…
          </div>
        )}

        {!loading && !isCompact && results.length > 0 && (
          <div className="border rounded-md max-h-[50vh] overflow-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="border-b sticky top-0 bg-background z-10">
                <tr className="bg-muted/50">
                  <th className="p-2 text-left font-semibold">Name</th>
                  <th className="p-2 text-left font-semibold">Date of Birth</th>
                  <th className="p-2 text-left font-semibold">Address</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const addressParts = [
                    r.streetAddress,
                    r.city,
                    r.stateUs,
                    r.zipCode
                  ].filter(Boolean);
                  const fullAddress = addressParts.join(', ');
                  
                  return (
                    <tr
                      key={r.id}
                      className="border-b cursor-pointer hover:bg-muted/50 transition-colors"
                      onDoubleClick={() => r.id && onSelect(r.id, r)}
                      onClick={() => r.id && onSelect(r.id, r)}
                    >
                      <td className="p-2">{r.lastName}, {r.firstName}</td>
                      <td className="p-2">{r.dateOfBirth || ''}</td>
                      <td className="p-2">{fullAddress}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && isCompact && (
          <div className="py-6">
            {!fromScan && (
              <p className="text-center font-semibold">Customer not found.</p>
            )}

            {fromScan && canAddFromScan && (
              <>
                <DialogDescription className="text-center font-semibold mb-4">
                  Customer not found. Add as a new customer?
                </DialogDescription>
                <DialogFooter className="flex gap-2 sm:justify-center">
                  <Button onClick={onAddFromScan}>Yes</Button>
                  <Button variant="outline" onClick={onClose}>No</Button>
                </DialogFooter>
              </>
            )}

            {fromScan && !canAddFromScan && (
              <p className="text-center font-semibold">Customer not found.</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
