// client/src/app/core/redux/store.ts
import { configureStore } from '@reduxjs/toolkit'
import auth from './authSlice';
import lookup from './lookupSlice';

export const store = configureStore({
    reducer: {
        auth,
        lookup,
    },
    // (you can add middleware, devTools, etc. here)
})

// Infer these types in your app:
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
