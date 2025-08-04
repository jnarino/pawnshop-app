// client/src/app/core/redux/store.ts
import { configureStore } from '@reduxjs/toolkit'
import customerReducer from '../../feature/customer/customerSlice'

export const store = configureStore({
    reducer: {
        customer: customerReducer,

    },
    // (you can add middleware, devTools, etc. here)
})

// Infer these types in your app:
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
