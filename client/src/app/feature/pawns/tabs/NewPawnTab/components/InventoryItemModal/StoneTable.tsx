import { Stone } from './types';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StoneTableProps {
  stones: Stone[];
  selectedStone: Stone | null;
  onSelectStone: (stone: Stone) => void;
}

export function StoneTable({ stones, selectedStone, onSelectStone }: StoneTableProps) {
  if (stones.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-500">
        No stones added yet
      </div>
    );
  }

  return (
    <div className="border rounded-md h-full flex flex-col">
      <div className="bg-slate-100 border-b px-3 py-2 grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-2 text-xs font-semibold">
        <div>Type</div>
        <div>Cut</div>
        <div>Weight</div>
        <div>Color</div>
        <div>Clarity</div>
      </div>
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {stones.map((stone) => (
            <div
              key={stone.id}
              onClick={() => onSelectStone(stone)}
              className={`
                px-3 py-2 grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr] gap-2 text-xs cursor-pointer
                hover:bg-slate-50 transition-colors
                ${selectedStone?.id === stone.id ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''}
              `}
            >
              <div className="font-medium">{stone.type}</div>
              <div className="text-gray-600">{stone.cut || '-'}</div>
              <div className="text-gray-600">
                {stone.weight ? `${stone.weight} ${stone.weightUnit || 'ct'}` : '-'}
              </div>
              <div className="text-gray-600">{stone.color || '-'}</div>
              <div className="text-gray-600">{stone.clarity || '-'}</div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
