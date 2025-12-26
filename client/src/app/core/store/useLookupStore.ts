import { create } from 'zustand';
import type { AttributeType, AttributeValue } from '../api/lookupApi';

interface LookupState {
    types: AttributeType[];
    typesLoaded: boolean;
    typesLoading: boolean;

    values: Record<string, AttributeValue[]>;
    valuesLoading: string[];
    valuesLoaded: string[];

    setTypes: (types: AttributeType[]) => void;
    setTypesLoading: (loading: boolean) => void;

    setValues: (typeName: string, values: AttributeValue[]) => void;
    addValueLoading: (typeName: string) => void;
    removeValueLoading: (typeName: string) => void;
}

export const useLookupStore = create<LookupState>((set) => ({
    types: [],
    typesLoaded: false,
    typesLoading: false,
    values: {},
    valuesLoading: [],
    valuesLoaded: [],

    setTypes: (types) => set({ types, typesLoaded: true, typesLoading: false }),
    setTypesLoading: (loading) => set({ typesLoading: loading }),

    setValues: (typeName, newValues) => set((state) => ({
        values: { ...state.values, [typeName.toUpperCase()]: newValues },
        valuesLoaded: [...state.valuesLoaded, typeName.toUpperCase()],
        valuesLoading: state.valuesLoading.filter(t => t !== typeName.toUpperCase())
    })),

    addValueLoading: (typeName) => set((state) => ({
        valuesLoading: [...state.valuesLoading, typeName.toUpperCase()]
    })),

    removeValueLoading: (typeName) => set((state) => ({
        valuesLoading: state.valuesLoading.filter(t => t !== typeName.toUpperCase())
    })),
}));
