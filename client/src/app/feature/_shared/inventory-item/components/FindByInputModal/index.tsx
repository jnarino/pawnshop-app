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

interface FindByInputModalProps {
  readonly open: boolean;
  readonly loading?: boolean;
  readonly error?: string | null;
  readonly onClose: () => void;
  readonly onFind: (value: string) => void;
  readonly title: string;
  readonly description: string;
  readonly inputLabel: string;
  readonly inputPlaceholder: string;
  readonly infoMessage: string;
  readonly findButtonText?: string;
  readonly findingButtonText?: string;
}

export function FindByInputModal({
  open,
  loading,
  error,
  onClose,
  onFind,
  title,
  description,
  inputLabel,
  inputPlaceholder,
  infoMessage,
  findButtonText = 'Find',
  findingButtonText = 'Finding...',
}: FindByInputModalProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !loading) {
      onFind(inputValue.trim());
    }
  }, [inputValue, loading, onFind]);

  const handleClose = useCallback(() => {
    if (!loading) {
      setInputValue('');
      onClose();
    }
  }, [loading, onClose]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>{infoMessage}</AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="search-input">{inputLabel}</Label>
              <Input
                id="search-input"
                type="text"
                placeholder={inputPlaceholder}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
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
            <Button type="submit" disabled={!inputValue.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {findingButtonText}
                </>
              ) : (
                findButtonText
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
