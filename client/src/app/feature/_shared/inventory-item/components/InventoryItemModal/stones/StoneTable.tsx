import { Stone } from './types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StoneTableProps {
  stones: Stone[];
  selectedStone: Stone | null;
  onSelectStone: (stone: Stone | null) => void;
}

export function StoneTable({ stones, selectedStone, onSelectStone }: StoneTableProps) {
  if (stones.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500 border rounded-md">
        No stones added yet
      </div>
    );
  }

  const handleRowClick = (stone: Stone) => {
    if (selectedStone?.id === stone.id) {
      onSelectStone(null);
    } else {
      onSelectStone(stone);
    }
  };

  return (
    <div className="border rounded-md h-full flex flex-col">
      <ScrollArea className="flex-1">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-100 hover:bg-slate-100">
              <TableHead className="text-xs font-semibold h-9">Type</TableHead>
              <TableHead className="text-xs font-semibold h-9">Qty</TableHead>
              <TableHead className="text-xs font-semibold h-9">Shape</TableHead>
              <TableHead className="text-xs font-semibold h-9">Carat</TableHead>
              <TableHead className="text-xs font-semibold h-9">Color</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stones.map((stone) => (
              <TableRow
                key={stone.id}
                onClick={() => handleRowClick(stone)}
                className={`cursor-pointer ${selectedStone?.id === stone.id ? 'bg-blue-50' : ''}`}
              >
                <TableCell className="text-xs py-2 font-medium">{stone.type}</TableCell>
                <TableCell className="text-xs py-2">{stone.quantity}</TableCell>
                <TableCell className="text-xs py-2">{stone.shape || '-'}</TableCell>
                <TableCell className="text-xs py-2">{stone.carat || '-'}</TableCell>
                <TableCell className="text-xs py-2">{stone.color || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
