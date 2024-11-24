import { ConferenceService } from './conference.service'
import { ConferenceContextState } from './context'
import { Participant } from './micro-services'

export interface InitialState {
  media: ConferenceContextState['media']
  signaling: ConferenceContextState['signaling']
  participants: Participant[]
  localScreenShare: ReturnType<ConferenceService['getState']>['localScreenShare']
  currentUser: ReturnType<ConferenceService['getState']>['currentUser']
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
  currentUser: undefined,
  localScreenShare: {
    stream: undefined,
    isVideoEnabled: false,
  },
}
