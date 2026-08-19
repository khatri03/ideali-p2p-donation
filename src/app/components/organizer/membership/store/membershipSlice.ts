import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface MembershipState {
  membershipId: string | null;
  completedSteps: number[];
}

const initialState: MembershipState = {
  membershipId: null,
  completedSteps: [],
};

const membershipSlice = createSlice({
  name: 'membership',
  initialState,
  reducers: {
    setMembershipId(state, action: PayloadAction<string>) {
      state.membershipId = action.payload;
    },
    completeStep(state, action: PayloadAction<number>) {
      if (!state.completedSteps.includes(action.payload)) {
        state.completedSteps.push(action.payload);
      }
    },
    resetWizard(state) {
      state.membershipId = null;
      state.completedSteps = [];
    },
  },
});

export const { setMembershipId, completeStep, resetWizard } = membershipSlice.actions;
export default membershipSlice.reducer;
