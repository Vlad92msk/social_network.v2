// conference/actions/index.ts

import { WebRTCSignal } from '../../types/media'

export const ConferenceEvents = {
  INITIATE_CONNECTION: 'conference:initiate_connection',
  HANDLE_SIGNAL: 'conference:handle_signal',
  SEND_SIGNAL: 'conference:send_signal',
  CLOSE_CONNECTION: 'conference:close_connection',
} as const

export const initiateConnection = (userId: string, isInitiator: boolean) => ({
  type: 'WEBRTC_INITIATE_CONNECTION',
  payload: {
    event: ConferenceEvents.INITIATE_CONNECTION,
    data: { userId, isInitiator },
  },
})

export const handleSignal = (userId: string, signal: WebRTCSignal) => ({
  type: 'WEBRTC_HANDLE_SIGNAL',
  payload: {
    event: ConferenceEvents.HANDLE_SIGNAL,
    data: { userId, signal },
  },
})

export const sendSignal = (targetUserId: string, signal: WebRTCSignal) => ({
  type: 'WEBRTC_SEND_SIGNAL',
  payload: {
    event: ConferenceEvents.SEND_SIGNAL,
    data: { targetUserId, signal },
  },
})

export const closeConnection = (userId: string) => ({
  type: 'WEBRTC_CLOSE_CONNECTION',
  payload: {
    event: ConferenceEvents.CLOSE_CONNECTION,
    data: { userId },
  },
})
