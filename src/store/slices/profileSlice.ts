import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchOrganizerProfile } from '../../app/service/organizer/Settings/profileService';

interface ProfileState {
  logoUrl: string | null;
  loading: boolean;
  fetched: boolean;
}

const initialState: ProfileState = {
  logoUrl: null,
  loading: false,
  fetched: false,
};

export const fetchProfileLogo = createAsyncThunk(
  'profile/fetchProfileLogo',
  async (_, { getState }) => {
    const state = getState() as { profile: ProfileState };
    // Skip if already fetched
    if (state.profile.fetched) return state.profile.logoUrl;

    const organizerUniqueId = localStorage.getItem('organizerUniqueId');
    if (!organizerUniqueId) return null;

    const profile = await fetchOrganizerProfile(organizerUniqueId);
    return profile?.organizer?.logoUrl || null;
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setLogoUrl(state, action) {
      state.logoUrl = action.payload;
      state.fetched = true;
    },
    clearProfile() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfileLogo.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProfileLogo.fulfilled, (state, action) => {
        state.logoUrl = action.payload;
        state.loading = false;
        state.fetched = true;
      })
      .addCase(fetchProfileLogo.rejected, (state) => {
        state.loading = false;
        state.fetched = true;
      });
  },
});

export const { setLogoUrl, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
