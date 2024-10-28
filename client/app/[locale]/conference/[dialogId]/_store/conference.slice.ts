import { PayloadAction } from '@reduxjs/toolkit'
import { sliceBuilder } from '../../../../../store/utils/other'
import { WebRTCSignal } from '../types/media'

export interface ConferenceSliceState {
  isConnected: boolean
  error: string | null

  conferenceId?: string

  users: string[]
  userSignals: Record<string, { userId: string, signal: WebRTCSignal }>
}

const initialState: ConferenceSliceState = {
  isConnected: false,
  error: null,

  conferenceId: undefined,

  users: [],
  userSignals: {},
}

export const { actions: ConferenceSliceActions, reducer: conferenceReducer } = sliceBuilder(
  ({ createSlice, setState }) => createSlice({
    name: '[CONFERENCE]',
    initialState,
    reducers: {
      setConnected: (state, action: PayloadAction<boolean>) => {
        state.isConnected = action.payload
      },
      setError: (state, action: PayloadAction<string>) => {
        state.error = action.payload
      },

      setConferenceId: (state, action: PayloadAction<string>) => {
        state.conferenceId = action.payload
      },

      setUserJoined: (state, action: PayloadAction<string>) => {
        state.users.push(action.payload)
      },

      setUserLeft: (state, action: PayloadAction<string>) => {
        state.users.filter((id) => id !== action.payload)
      },

      setParticipants: (state, action: PayloadAction<string[]>) => {
        state.users = action.payload
      },

      setUserSignals: (state, action: PayloadAction<{ userId: string, signal: WebRTCSignal }>) => {
        const { userId } = action.payload
        state.userSignals[userId] = action.payload
      },

    },
  }),
)
