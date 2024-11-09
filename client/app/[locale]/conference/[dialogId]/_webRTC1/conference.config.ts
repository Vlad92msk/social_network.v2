import { ConferenceConfig } from './conference.service'

export const conferenceConfig = ({
  signaling: { userId, dialogId },
  localVideo,
}:{
  signaling: {
    userId: string,
    dialogId: string
  },
  localVideo?: {
    audio?: boolean,
    video?: boolean,
  }
}):ConferenceConfig => ({
  signaling: {
    url: 'http://localhost:3001/conference',
    userId,
    dialogId,
  },
  mediaConstraints: localVideo,
  ice: [{ urls: 'stun:stun.l.google.com:19302' }],
})
