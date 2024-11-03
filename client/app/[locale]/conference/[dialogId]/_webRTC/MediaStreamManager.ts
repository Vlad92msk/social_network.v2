import { MediaType } from './types'

export class MediaStreamManager {
  private streams: Record<MediaType, MediaStream | null> = {
    video: null,
    screen: null,
    audio: null,
  }

  async setStream(type: MediaType, stream: MediaStream | null) {
    this.streams[type] = stream
    return stream
  }

  async getStream(type: MediaType) {
    return this.streams[type]
  }

  async startScreenShare() {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true })
      return this.setStream('screen', stream)
    } catch (error) {
      throw new Error(`Failed to start screen sharing: ${error}`)
    }
  }

  async startVideoStream(constraints: MediaStreamConstraints = { video: true, audio: true }) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      return this.setStream('video', stream)
    } catch (error) {
      throw new Error(`Failed to start video stream: ${error}`)
    }
  }

  stopStream(type: MediaType) {
    const stream = this.streams[type]
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      this.streams[type] = null
    }
  }

  getActiveStreams() {
    return Object.entries(this.streams)
      .filter(([_, stream]) => stream !== null)
      .reduce((acc, [type, stream]) => ({
        ...acc,
        [type]: stream,
      }), {} as Record<MediaType, MediaStream>)
  }
}
