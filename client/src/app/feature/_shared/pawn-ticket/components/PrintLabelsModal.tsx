import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PrintItem {
  id: string;
  inventoryNumber: string;
  description: string;
  amount: string;
  quantity?: number;
}

interface Props {
  open: boolean;
  controlNumber: string;
  items: PrintItem[];
  onPrint: (labelCounts: Record<string, number>) => void;
  onCancel: () => void;
}

export function PrintLabelsModal({ open, controlNumber, items, onPrint, onCancel }: Props) {
  // Initialize label counts - default 1 label per item
  const [labelCounts, setLabelCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    items.forEach(item => {
      initial[item.id] = 1;
    });
    return initial;
  });

  const updateLabelCount = (itemId: string, count: number) => {
    setLabelCounts(prev => ({
      ...prev,
      [itemId]: Math.max(0, Math.min(99, count)) // Limit between 0-99
    }));
  };

  const getTotalLabels = () => {
    return Object.values(labelCounts).reduce((sum, count) => sum + count, 0);
  };

  const handlePrint = () => {
    onPrint(labelCounts);
  };

  const handleReset = () => {
    const reset: Record<string, number> = {};
    items.forEach(item => {
      reset[item.id] = 1;
    });
    setLabelCounts(reset);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enter # of PAWN Labels</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <AlertDescription className="text-sm">
              📄 <strong>Pawn ticket form is printing...</strong><br />
              Select label quantities below and click "Print Labels" to complete the transaction.
            </AlertDescription>
          </Alert>

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]"># Labels</TableHead>
                  <TableHead className="w-[100px]">Quantity</TableHead>
                  <TableHead>Description of Item</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max="99"
                        value={labelCounts[item.id] || 1}
                        onChange={(e) => updateLabelCount(item.id, parseInt(e.target.value) || 0)}
                        className="w-20 h-8 text-center"
                      />
                    </TableCell>
                    <TableCell>{item.quantity || 1}.00</TableCell>
                    <TableCell className="uppercase font-medium">
                      {item.description.toUpperCase()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center gap-3 pt-2">
            <div className="text-sm">
              Total Labels: <strong className="text-lg">{getTotalLabels()}</strong>
            </div>
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                Reset
              </Button>
              
              <Button 
                type="button" 
                variant="secondary"
                size="sm"
                onClick={onCancel}
              >
                Skip Labels
              </Button>
              
              <Button 
                type="button" 
                onClick={handlePrint}
                disabled={getTotalLabels() === 0}
                size="sm"
              >
                Print Labels & Complete
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
