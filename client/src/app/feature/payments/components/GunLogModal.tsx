import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface GunLogModalProps {
    open: boolean;
    successMessage?: string | null;
    onSave: (data: { nicsNumber: string; comments: string }) => void;
    onClose: () => void;
}

export function GunLogModal({ open, successMessage, onSave, onClose }: GunLogModalProps) {
    const [nicsNumber, setNicsNumber] = useState('');
    const [comments, setComments] = useState('Gun was picked up by the same customer');

    const handleSave = () => {
        onSave({ nicsNumber, comments });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Gun Log Information</DialogTitle>
                </DialogHeader>

                {successMessage ? (
                    <div className="py-6 flex items-center justify-center text-center">
                        <p className="text-lg font-medium text-green-600">{successMessage}</p>
                    </div>
                ) : (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nicsNumber">NICS Number</Label>
                            <Input
                                id="nicsNumber"
                                value={nicsNumber}
                                onChange={(e) => setNicsNumber(e.target.value)}
                                placeholder="Enter NICS Number"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="comments">Comments</Label>
                            <Textarea
                                id="comments"
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                                placeholder="Enter comments..."
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {successMessage ? (
                        <Button onClick={onClose} className="w-full">Ok</Button>
                    ) : (
                        <Button onClick={handleSave} disabled={!nicsNumber}>Saved</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
