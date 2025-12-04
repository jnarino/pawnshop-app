import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { StoneForm } from './StoneForm';
import { StoneTable } from './StoneTable';
import { useStonesCrud } from './useStonesCrud';
import { Stone } from './types';

interface StonesSectionProps {
  stones: Stone[];
  onStonesChange: (stones: Stone[]) => void;
}

export function StonesSection({ stones, onStonesChange }: StonesSectionProps) {
  const {
    selectedStone,
    isEditing,
    addStone,
    updateStone,
    removeStone,
    startEdit,
    cancelEdit,
    setSelectedStone
  } = useStonesCrud({ stones, onStonesChange });

  const handleAdd = (stone: Omit<Stone, 'id'>) => {
    addStone(stone);
  };

  const handleUpdate = (stone: Omit<Stone, 'id'>) => {
    if (selectedStone) {
      updateStone(selectedStone.id, stone);
    }
  };

  const handleRemove = () => {
    if (selectedStone) {
      removeStone(selectedStone.id);
    }
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="stones" className="border rounded-md px-4">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          Stones {stones.length > 0 && <span className="ml-2 text-xs text-gray-500">({stones.length})</span>}
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-12 gap-4 mt-2">
            <div className="col-span-4 space-y-3">
              <StoneForm
                initialStone={isEditing ? selectedStone : null}
                onSubmit={isEditing ? handleUpdate : handleAdd}
                onCancel={cancelEdit}
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => isEditing ? startEdit(selectedStone!) : undefined}
                  disabled={!selectedStone || isEditing}
                  className="w-full text-xs"
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleRemove}
                  disabled={!selectedStone}
                  className="w-full text-xs"
                >
                  Remove
                </Button>
              </div>
            </div>

            <div className="col-span-8 h-[400px]">
              <StoneTable
                stones={stones}
                selectedStone={selectedStone}
                onSelectStone={setSelectedStone}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
