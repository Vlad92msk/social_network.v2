export interface MediaStreamOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

export class SimpleMediaStreamService {
  private stream: MediaStream | undefined = undefined

  private videoTrack: MediaStreamTrack | null = null

  private audioTrack: MediaStreamTrack | null = null

  private state = {
    isVideoEnabled: false,
    isAudioEnabled: false,
  }

  private readonly defaultConstraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  }

  constructor() {}

  private updateState(): void {
    const videoTracks = this.stream?.getVideoTracks() || []
    const audioTracks = this.stream?.getAudioTracks() || []

    this.state.isVideoEnabled = videoTracks.length > 0 && videoTracks[0].readyState === 'live'
    this.state.isAudioEnabled = audioTracks.length > 0 && audioTracks[0].readyState === 'live' && audioTracks[0].enabled
  }

  async initialize(options?: MediaStreamOptions): Promise<void> {
    try {
      const constraints = {
        video: options?.video,
        audio: options?.audio,
      }

      // Очищаем предыдущий стрим, если он существует
      this.cleanup()

      if (!constraints.video && !constraints.audio) {
        return
      }

      this.stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (constraints.video) {
        this.videoTrack = this.stream.getVideoTracks()[0] || null
      }

      if (constraints.audio) {
        this.audioTrack = this.stream.getAudioTracks()[0] || null
      }

      this.updateState()
    } catch (error) {
      console.error('Error initializing media stream:', error)
      this.handleError(error)
    }
  }

  getState() {
    this.updateState()
    return {
      isVideoEnabled: this.state.isVideoEnabled,
      isAudioEnabled: this.state.isAudioEnabled,
    }
  }

  getStream(): MediaStream | undefined {
    return this.stream
  }

  async toggleVideo(): Promise<void> {
    try {
      if (this.videoTrack) {
        this.videoTrack.stop()
        if (this.stream) {
          this.stream.removeTrack(this.videoTrack)
        }
        this.videoTrack = null
      } else {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: this.defaultConstraints.video,
        })

        this.videoTrack = videoStream.getVideoTracks()[0]

        if (this.stream) {
          this.stream.addTrack(this.videoTrack)
        } else {
          this.stream = new MediaStream([this.videoTrack])
          if (this.audioTrack) {
            this.stream.addTrack(this.audioTrack)
          }
        }
      }

      this.updateState()
    } catch (error) {
      this.handleError(error)
    }
  }

  async toggleAudio(): Promise<void> {
    try {
      if (this.audioTrack) {
        this.audioTrack.enabled = !this.audioTrack.enabled
      } else {
        // Создаем новый аудиотрек
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: this.defaultConstraints.audio,
        })

        this.audioTrack = audioStream.getAudioTracks()[0]
        this.audioTrack.enabled = true

        if (this.stream) {
          this.stream.addTrack(this.audioTrack)
        } else {
          this.stream = new MediaStream([this.audioTrack])
          if (this.videoTrack) {
            this.stream.addTrack(this.videoTrack)
          }
        }
      }

      this.updateState()
    } catch (error) {
      console.error('Error toggling audio:', error)
      this.handleError(error)
    }
  }

  cleanup(): void {
    if (this.videoTrack) {
      this.videoTrack.stop()
      this.videoTrack = null
    }

    if (this.audioTrack) {
      this.audioTrack.stop()
      this.audioTrack = null
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop()
      })
      this.stream = undefined
    }

    this.updateState()
  }

  private handleError(error: unknown): never {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Media stream error: ${message}`)
  }
}
