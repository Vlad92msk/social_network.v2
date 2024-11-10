import { ConferenceService } from './conference.service'
import { ConferenceContextState } from './context'

export interface InitialState {
  media: ConferenceContextState['media']
  signaling: ConferenceContextState['signaling']
  participants: string[]
  localScreenShare: ReturnType<ConferenceService['getState']>['localScreenShare']
  streams: ReturnType<ConferenceService['getState']>['streams']
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
  localScreenShare: {
    stream: undefined,
    isVideoEnabled: false,
  },
  streams: [],
}
