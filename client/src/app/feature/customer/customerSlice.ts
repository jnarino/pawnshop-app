import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Customer { /* … */ }

const customerSlice = createSlice({
    name: 'customer',
    initialState: [] as Customer[],
    reducers: {
        addCustomer(state, action: PayloadAction<Customer>) {
            state.push(action.payload)
        },
        // …more action handlers
    }
})

export default customerSlice.reducer
export const { addCustomer } = customerSlice.actions
