import { Stone } from './types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLookup } from '@/app/shared/hooks/useLookup';
import { LookupTypeName } from '@/app/shared/types/lookup';
import { useMemo } from 'react';

interface StoneTableProps {
  readonly stones: Stone[];
  readonly selectedStone: Stone | null;
  readonly onSelectStone: (stone: Stone | null) => void;
}

export function StoneTable({ stones, selectedStone, onSelectStone }: StoneTableProps) {
  // Load lookup values to resolve IDs to names
  const { options: shapeOptions } = useLookup(LookupTypeName.SHAPE);
  const { options: colorOptions } = useLookup(LookupTypeName.COLOR);

  // Create lookup maps for quick ID-to-name resolution
  const shapeMap = useMemo(() => 
    new Map(shapeOptions.map(opt => [opt.id, opt.value])), 
    [shapeOptions]
  );
  const colorMap = useMemo(() => 
    new Map(colorOptions.map(opt => [opt.id, opt.value])), 
    [colorOptions]
  );

  // Helper to resolve ID to name
  const resolveName = (id: string | undefined, map: Map<string, string>): string => {
    if (!id) return '-';
    return map.get(id) || id;
  };

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
                <TableCell className="text-xs py-2 font-medium">{resolveName(stone.type, shapeMap)}</TableCell>
                <TableCell className="text-xs py-2">{stone.quantity}</TableCell>
                <TableCell className="text-xs py-2">{resolveName(stone.shape, shapeMap)}</TableCell>
                <TableCell className="text-xs py-2">{stone.carat || '-'}</TableCell>
                <TableCell className="text-xs py-2">{resolveName(stone.color, colorMap)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
