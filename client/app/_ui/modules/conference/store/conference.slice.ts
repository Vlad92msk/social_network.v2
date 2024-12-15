import { PayloadAction } from '@reduxjs/toolkit'
import { sliceBuilder } from '../../../../../store/utils/other'

export interface ConferenceSliceState {
  speakingUsers: Record<string, boolean>
}

const conferenceInitialState: ConferenceSliceState = {
  speakingUsers: {},
}

export const { actions: ConferenceSliceActions, reducer: conferenceReducer } = sliceBuilder(
  ({ createSlice }) => createSlice({
    name: '[CONFERENCE]',
    initialState: conferenceInitialState,
    reducers: {
      setSpeakingUsers: (state, action: PayloadAction<{ userId: string, value: boolean }>) => {
        const { userId, value } = action.payload
        state.speakingUsers[userId] = value
      },
    },
  }),
)
