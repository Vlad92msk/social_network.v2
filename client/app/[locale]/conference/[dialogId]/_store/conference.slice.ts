import { PayloadAction } from '@reduxjs/toolkit'
import { sliceBuilder } from '../../../../../store/utils/other'
import { WebRTCSignal } from '../types/media'

interface RoomParticipant {
  userId: string;
  joinedAt: Date;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
}

export interface ConferenceSliceState {
  isConnected: boolean
  error: string | null
  conferenceId?: string
  users: string[]
  userSignals: Record<string, { userId: string, signal: WebRTCSignal }>
  roomInfo: { dialogId?: string, participants: string[], participantsCount: number, createdAt?: Date }
}

const initialState: ConferenceSliceState = {
  isConnected: false,
  error: null,
  conferenceId: undefined,
  users: [],
  userSignals: {},
  roomInfo: {
    dialogId: undefined,
    participants: [],
    participantsCount: 0,
    createdAt: undefined
  },
}

export const { actions: ConferenceSliceActions, reducer: conferenceReducer } = sliceBuilder(
  ({ createSlice }) => createSlice({
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
        if (!state.users.includes(action.payload)) {
          state.users.push(action.payload)
        }
      },
      setUserLeft: (state, action: PayloadAction<string>) => {
        state.users = state.users.filter((id) => id !== action.payload)
        delete state.userSignals[action.payload]
      },
      setParticipants: (state, action: PayloadAction<string[]>) => {
        state.users = action.payload
      },
      // Добавляем новый сигнал
      addSignal: (state, action: PayloadAction<{ userId: string, signal: WebRTCSignal }>) => {
        state.userSignals[action.payload.userId] = {
          userId: action.payload.userId,
          signal: action.payload.signal,
        }
      },
      sendSignal: (state, action: PayloadAction<{ targetUserId: string, signal: WebRTCSignal, dialogId: string}>) => state,
      setRoomInfo: (state, action: PayloadAction<ConferenceSliceState['roomInfo']>) => {
        state.roomInfo = action.payload
        state.users = action.payload.participants
      },

      clearSignal: (state, action: PayloadAction<{ userId: string }>) => {
        console.log('Clearing signal for:', action.payload.userId) // Добавляем лог
        delete state.userSignals[action.payload.userId]
      },
    },
  }),
)
