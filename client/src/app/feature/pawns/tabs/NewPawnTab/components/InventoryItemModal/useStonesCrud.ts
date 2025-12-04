import { useState, useCallback } from 'react';
import { Stone } from './types';

interface UseStonesCrudProps {
  stones: Stone[];
  onStonesChange: (stones: Stone[]) => void;
}

export function useStonesCrud({ stones, onStonesChange }: UseStonesCrudProps) {
  const [selectedStone, setSelectedStone] = useState<Stone | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const addStone = useCallback((stone: Omit<Stone, 'id'>) => {
    const newStone: Stone = {
      ...stone,
      id: crypto.randomUUID()
    };
    onStonesChange([...stones, newStone]);
  }, [stones, onStonesChange]);

  const updateStone = useCallback((id: string, stone: Omit<Stone, 'id'>) => {
    const updated = stones.map(s => 
      s.id === id ? { ...stone, id } : s
    );
    onStonesChange(updated);
    setSelectedStone(null);
    setIsEditing(false);
  }, [stones, onStonesChange]);

  const removeStone = useCallback((id: string) => {
    onStonesChange(stones.filter(s => s.id !== id));
    if (selectedStone?.id === id) {
      setSelectedStone(null);
      setIsEditing(false);
    }
  }, [stones, onStonesChange, selectedStone]);

  const startEdit = useCallback((stone: Stone) => {
    setSelectedStone(stone);
    setIsEditing(true);
  }, []);

  const cancelEdit = useCallback(() => {
    setSelectedStone(null);
    setIsEditing(false);
  }, []);

  return {
    selectedStone,
    isEditing,
    addStone,
    updateStone,
    removeStone,
    startEdit,
    cancelEdit,
    setSelectedStone
  };
}
