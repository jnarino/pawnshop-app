import { useState, useCallback } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { StoneForm } from './StoneForm';
import { StoneTable } from './StoneTable';
import { Stone } from './types';

interface StonesSectionProps {
  readonly stones: Stone[];
  readonly onChange: (stones: Stone[]) => void;
  readonly disabled?: boolean;
}

export function StonesSection({ stones, onChange, disabled = false }: StonesSectionProps) {
  const [selectedStone, setSelectedStone] = useState<Stone | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const addStone = useCallback((stone: Omit<Stone, 'id'>) => {
    const newStone: Stone = { ...stone, id: crypto.randomUUID() };
    onChange([...stones, newStone]);
  }, [stones, onChange]);

  const updateStone = useCallback((id: string, updates: Omit<Stone, 'id'>) => {
    onChange(stones.map(s => s.id === id ? { ...updates, id } : s));
    setSelectedStone(null);
    setIsEditing(false);
  }, [stones, onChange]);

  const removeStone = useCallback((id: string) => {
    onChange(stones.filter(s => s.id !== id));
    if (selectedStone?.id === id) {
      setSelectedStone(null);
      setIsEditing(false);
    }
  }, [stones, onChange, selectedStone]);

  const startEdit = useCallback((stone: Stone) => {
    setSelectedStone(stone);
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setSelectedStone(null);
    setIsEditing(false);
  }, []);

  const handleAdd = useCallback((stone: Omit<Stone, 'id'>) => {
    addStone(stone);
  }, [addStone]);

  const handleUpdate = useCallback((stone: Omit<Stone, 'id'>) => {
    if (selectedStone) {
      updateStone(selectedStone.id, stone);
    }
  }, [selectedStone, updateStone]);

  const handleRemove = useCallback(() => {
    if (selectedStone) {
      removeStone(selectedStone.id);
    }
  }, [selectedStone, removeStone]);

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
                disabled={disabled}
              />
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(selectedStone!)}
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
