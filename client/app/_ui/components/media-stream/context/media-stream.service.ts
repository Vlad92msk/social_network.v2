export interface MediaStreamOptions {
  audio?: boolean
  video?: boolean
  videoConstraints?: MediaTrackConstraints
  audioConstraints?: MediaTrackConstraints
}

interface MediaStreamState {
  stream?: MediaStream
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  error: Error | null
}

type MediaStreamListener = (state: MediaStreamState) => void

export class MediaStreamManager {
  private state: MediaStreamState = {
    stream: undefined,
    isVideoEnabled: false,
    isAudioEnabled: false,
    error: null,
  }

  private listeners: Set<MediaStreamListener> = new Set()

  private constraints: {
    video: false | MediaTrackConstraints
    audio: false | MediaTrackConstraints
  }

  constructor(options: MediaStreamOptions = { audio: false, video: true }) {
    this.constraints = {
      video: options.video ? {
        ...options.videoConstraints,
      } : false,
      audio: options.audio ? {
        ...options.audioConstraints,
      } : false,
    }
    this.state.isVideoEnabled = !!options.video
    this.state.isAudioEnabled = !!options.audio
  }

  private setState(newState: Partial<MediaStreamState>) {
    this.state = { ...this.state, ...newState }
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  subscribe(listener: MediaStreamListener) {
    this.listeners.add(listener)
    listener(this.state)

    return () => {
      this.listeners.delete(listener)
    }
  }

  async startStream() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(this.constraints)
      this.setState({
        stream: mediaStream,
        isVideoEnabled: true,
        isAudioEnabled: true,
        error: null,
      })
    } catch (err) {
      this.setState({
        error: err instanceof Error ? err : new Error('Failed to get media stream'),
        stream: undefined,
      })
    }
  }

  stopStream() {
    if (this.state.stream) {
      this.state.stream.getTracks().forEach((track) => track.stop())
      this.setState({
        stream: undefined,
        isVideoEnabled: false,
        isAudioEnabled: false,
      })
    }
  }

  async toggleVideo() {
    try {
      if (!this.state.stream) {
        await this.startStream()
        return
      }

      const videoTrack = this.state.stream.getVideoTracks()[0]

      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        this.setState({ isVideoEnabled: videoTrack.enabled })
      } else if (!videoTrack && this.constraints.video) {
        const newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: this.constraints.video,
        })

        const newVideoTrack = newVideoStream.getVideoTracks()[0]
        this.state.stream.addTrack(newVideoTrack)
        this.setState({ isVideoEnabled: true })
      }
    } catch (err) {
      this.setState({
        error: err instanceof Error ? err : new Error('Failed to toggle video'),
      })
    }
  }

  toggleAudio() {
    if (this.state.stream) {
      const audioTrack = this.state.stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        this.setState({ isAudioEnabled: audioTrack.enabled })
      }
    }
  }

  destroy() {
    this.stopStream()
    this.listeners.clear()
  }

  getState(): MediaStreamState {
    return this.state
  }
}
