import { ConferenceService } from './conference.service'

export interface ConferenceState {
  participants: ReturnType<ConferenceService['getState']>['participants']
  roomInfo: ReturnType<ConferenceService['getState']>['roomInfo']
  localMedia: ReturnType<ConferenceService['getState']>['localMedia']
  screenShare: ReturnType<ConferenceService['getState']>['screenShare']
  connections: ReturnType<ConferenceService['getState']>['connections']
  currentUser: ReturnType<ConferenceService['getState']>['currentUser']
}

export const initialState: ConferenceState = {
  participants: [],
  roomInfo: {
    currentUser: undefined,
    roomId: undefined,
    participants: []
  },
  currentUser: undefined,
  //@ts-ignore
  localMedia: {},
  screenShare: {
    stream: undefined,
    isVideoEnabled: false,
  },
  connections: [],
}
