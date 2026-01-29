import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Props {
    readonly open: boolean;
    readonly onCancel: () => void;
    readonly onConfirm: (reason: string) => void;
}

export function VoidPawnModal({ open, onCancel, onConfirm }: Props) {
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        onConfirm(reason);
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                    <DialogTitle>Void Pawn</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Reason for void *</Label>
                        <Textarea
                            placeholder="Enter reason..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="resize-none"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!reason.trim()}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Save void
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
