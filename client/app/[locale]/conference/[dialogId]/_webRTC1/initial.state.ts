import { ConferenceContextState } from './context'

export interface InitialState {
  media: ConferenceContextState['media']
  signaling: ConferenceContextState['signaling']
  participants: string[]
}

export const initialState: InitialState = {
  media: {
    isVideoEnabled: false,
    isAudioEnabled: false,
    error: null,
  },
  signaling: {
    isConnected: false,
    error: null,
  },
  participants: [],
}
