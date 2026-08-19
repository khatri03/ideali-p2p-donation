import { configureStore } from '@reduxjs/toolkit';
import donationReducer from './slices/donationSlice';
import profileReducer from './slices/profileSlice';

export const store = configureStore({
  reducer: {
    donation: donationReducer,
    profile: profileReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
