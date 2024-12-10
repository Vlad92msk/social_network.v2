import { ConferenceService } from './conference.service'

export interface ConferenceState {
  participants: ReturnType<ConferenceService['getState']>['participants']
  roomInfo: ReturnType<ConferenceService['getState']>['roomInfo']
  localMedia: ReturnType<ConferenceService['getState']>['localMedia']
  screenShare: ReturnType<ConferenceService['getState']>['screenShare']
  connections: ReturnType<ConferenceService['getState']>['connections']
  currentUser: ReturnType<ConferenceService['getState']>['currentUser']
  remoteStreams: ReturnType<ConferenceService['getState']>['remoteStreams']
}

export const initialState: ConferenceState = {
  participants: [],
  remoteStreams: [],
  roomInfo: {
    s: [],
    currentUser: undefined,
    roomId: undefined,
    participants: [],
  },
  currentUser: undefined,
  localMedia: {
    hasAudio: false,
    hasVideo: false,
    audioSettings: null,
    currentAudioDevice: null,
    currentVideoDevice: null,
    videoSettings: null,
    stream: null,
    isAudioEnabled: false,
    isVideoEnabled: false,
    isAudioMuted: false,
    isVideoMuted: false,
    isSpeaking: false,
    volume: 0,
  },
  screenShare: {
    stream: undefined,
    isVideoEnabled: false,
  },
  connections: [],
}
