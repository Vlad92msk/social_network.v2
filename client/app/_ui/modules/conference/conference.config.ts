import { ConferenceConfig } from './services'
import { MediaStreamOptions } from './services/media-stream.service'

export const conferenceConfig = ({
  signaling: { userId, dialogId },
  mediaConfig,
}:{
  signaling: {
    userId: string,
    dialogId: string
  },
  mediaConfig?: MediaStreamOptions
}): ConferenceConfig => ({
  signaling: {
    url: 'http://localhost:3001/conference',
    userId,
    dialogId,
  },
  mediaConfig: {
    video: false,
    audio: false,
    echoCancellation: true,
    noiseSuppression: true,
    ...mediaConfig,
  },
  ice: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
})
