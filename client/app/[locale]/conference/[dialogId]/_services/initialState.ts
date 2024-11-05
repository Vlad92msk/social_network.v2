import { WebRTCState, WebRTCStateChangeType } from './types'

export const webRTCInitialState: WebRTCState = {
  [WebRTCStateChangeType.STREAM]: {
    streams: {},
  },
  [WebRTCStateChangeType.DIALOG]: {
    currentUserId: '',
    dialogId: '',
  },
  [WebRTCStateChangeType.CONNECTION]: {
    isConnecting: false,
    connectionStatus: {},
  },
  [WebRTCStateChangeType.SIGNAL]: {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  },
  [WebRTCStateChangeType.SCREEN]: {
    localScreenStream: undefined,
    remoteScreenStreams: {},
    isSharing: false,
  },
}
