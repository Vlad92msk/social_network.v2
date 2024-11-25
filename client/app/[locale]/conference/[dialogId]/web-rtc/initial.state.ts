import { ConferenceService } from './conference.service'
import { Participant } from './micro-services'

export interface ConferenceState {
  participants: ReturnType<ConferenceService['getState']>['participants']
  localMedia: ReturnType<ConferenceService['getState']>['localMedia']
  screenShare: ReturnType<ConferenceService['getState']>['screenShare']
  connections: ReturnType<ConferenceService['getState']>['connections']
  currentUser: ReturnType<ConferenceService['getState']>['currentUser']
}

export const initialState: ConferenceState = {
  participants: [],
  currentUser: undefined,
  localMedia: {
    stream: null,
    isVideoEnabled: false,
    isAudioEnabled: false,
    hasVideo: false,
    hasAudio: false,
  },
  screenShare: {
    stream: undefined,
    isVideoEnabled: false,
  },
  connections: [],
}
