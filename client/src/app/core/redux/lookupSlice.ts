import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAttributeTypes, getAttributeValues, AttributeType, AttributeValue } from '../api/lookupApi';

interface LookupState {
  types: AttributeType[];
  typesLoaded: boolean;
  typesLoading: boolean;
  values: Record<string, AttributeValue[]>;
  valuesLoading: string[];
  valuesLoaded: string[];
}

const initialState: LookupState = {
  types: [],
  typesLoaded: false,
  typesLoading: false,
  values: {},
  valuesLoading: [],
  valuesLoaded: [],
};

export const fetchAttributeTypes = createAsyncThunk(
  'lookup/fetchAttributeTypes',
  async (_, { getState }) => {
    const state = getState() as { lookup: LookupState };
    if (state.lookup.typesLoaded) {
      return state.lookup.types;
    }
    return getAttributeTypes();
  }
);

export const fetchAttributeValues = createAsyncThunk(
  'lookup/fetchAttributeValues',
  async (typeName: string, { getState }) => {
    const state = getState() as { lookup: LookupState };
    
    const typeEntry = state.lookup.types.find(
      t => t.name.toUpperCase() === typeName.toUpperCase()
    );
    
    if (!typeEntry) {
      throw new Error(`Type "${typeName}" not found`);
    }
    
    if (state.lookup.valuesLoaded.includes(typeName.toUpperCase())) {
      return { typeName: typeName.toUpperCase(), values: state.lookup.values[typeName.toUpperCase()] };
    }
    
    const values = await getAttributeValues(typeEntry.id);
    return { typeName: typeName.toUpperCase(), values };
  }
);

const lookupSlice = createSlice({
  name: 'lookup',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttributeTypes.pending, (state) => {
        state.typesLoading = true;
      })
      .addCase(fetchAttributeTypes.fulfilled, (state, action: PayloadAction<AttributeType[]>) => {
        state.types = action.payload;
        state.typesLoaded = true;
        state.typesLoading = false;
      })
      .addCase(fetchAttributeTypes.rejected, (state) => {
        state.typesLoading = false;
      })
      .addCase(fetchAttributeValues.pending, (state, action) => {
        const typeName = action.meta.arg.toUpperCase();
        if (!state.valuesLoading.includes(typeName)) {
          state.valuesLoading.push(typeName);
        }
      })
      .addCase(fetchAttributeValues.fulfilled, (state, action) => {
        const { typeName, values } = action.payload;
        state.values[typeName] = values;
        state.valuesLoaded.push(typeName);
        state.valuesLoading = state.valuesLoading.filter(t => t !== typeName);
      })
      .addCase(fetchAttributeValues.rejected, (state, action) => {
        const typeName = action.meta.arg.toUpperCase();
        state.valuesLoading = state.valuesLoading.filter(t => t !== typeName);
      });
  },
});

export default lookupSlice.reducer;
