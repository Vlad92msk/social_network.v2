import { PayloadAction } from '@reduxjs/toolkit'
import { sliceBuilder } from '../../../../../store/utils/other'
import { WebRTCSignal } from '../types/media'

export interface ConferenceSliceState {
  isConnected: boolean
  error: string | null

  conferenceId?: string

  users: string[]
  userSignals: Record<string, { userId: string, signal: WebRTCSignal }>

  streams: Record<string, MediaStream>
  connections: Record<string, RTCPeerConnection>
}

const initialState: ConferenceSliceState = {
  isConnected: false,
  error: null,

  conferenceId: undefined,

  users: [],
  userSignals: {},

  streams: {},
  connections: {},
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
        delete state.streams[action.payload]
        if (state.connections[action.payload]) {
          state.connections[action.payload].close()
          delete state.connections[action.payload]
        }
      },
      setParticipants: (state, action: PayloadAction<string[]>) => {
        state.users = action.payload
      },
      addStream: (state, action: PayloadAction<{ userId: string, stream: MediaStream }>) => {
        state.streams[action.payload.userId] = action.payload.stream
      },
      addConnection: (state, action: PayloadAction<{ userId: string, connection: RTCPeerConnection }>) => {
        state.connections[action.payload.userId] = action.payload.connection
      },
      clearSignal: (state, action: PayloadAction<{ userId: string }>) => {
        delete state.userSignals[action.payload.userId]
      },
      closeConnection: (state, action: PayloadAction<string>) => {
        const userId = action.payload
        if (state.connections[userId]) {
          state.connections[userId].close()
          delete state.connections[userId]
        }
        delete state.streams[userId]
        state.userSignals = Object.fromEntries(
          Object.entries(state.userSignals).filter(([key]) => key !== userId),
        )
      },
    },
  }),
)
