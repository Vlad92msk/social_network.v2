export interface MediaStreamOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

export class SimpleMediaStreamService {
  private stream: MediaStream | null = null

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

  private logTrackDetails(track: MediaStreamTrack | null, prefix: string = '') {
    if (!track) {
      console.log(`${prefix} Track: null`)
      return
    }

    console.log(`${prefix} Track details:`, {
      id: track.id,
      kind: track.kind,
      label: track.label,
      enabled: track.enabled,
      muted: track.muted,
      readyState: track.readyState,
      constraints: track.getConstraints(),
      settings: track.getSettings(),
    })
  }

  logStreamState(prefix: string = '') {
    console.group(`${prefix} Media Stream Debug Info`)

    console.log('Service state:', {
      isVideoEnabled: this.state.isVideoEnabled,
      isAudioEnabled: this.state.isAudioEnabled,
    })

    if (!this.stream) {
      console.log('Stream: null')
      console.groupEnd()
      return
    }

    console.log('Stream info:', {
      id: this.stream.id,
      active: this.stream.active,
      trackCount: this.stream.getTracks().length,
    })

    console.log('Video track:')
    this.logTrackDetails(this.videoTrack, '→')

    console.log('Audio track:')
    this.logTrackDetails(this.audioTrack, '→')

    // Проверяем все треки в стриме для выявления возможных расхождений
    console.log('All tracks in stream:')
    this.stream.getTracks().forEach((track, index) => {
      console.log(`→ Track ${index}:`, {
        id: track.id,
        kind: track.kind,
        enabled: track.enabled,
        readyState: track.readyState,
      })
    })

    console.groupEnd()
  }

  private updateState(): void {
    const videoTracks = this.stream?.getVideoTracks() || []
    const audioTracks = this.stream?.getAudioTracks() || []

    this.state.isVideoEnabled = videoTracks.length > 0 && videoTracks[0].readyState === 'live'
    this.state.isAudioEnabled = audioTracks.length > 0 && audioTracks[0].readyState === 'live' && audioTracks[0].enabled
  }

  async initialize(options?: MediaStreamOptions): Promise<void> {
    try {
      console.log('Initializing media stream...', options)

      const constraints = {
        video: options?.video,
        audio: options?.audio,
      }

      // Очищаем предыдущий стрим, если он существует
      this.cleanup()

      if (!constraints.video && !constraints.audio) {
        console.log('No constraints provided, skipping initialization')
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
      this.logStreamState('After initialization -')
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

  getStream(): MediaStream | null {
    return this.stream
  }

  async toggleVideo(): Promise<void> {
    try {
      console.group('Toggle Video Operation')
      console.log('Starting video toggle...')
      this.logStreamState('Before -')

      if (this.videoTrack) {
        console.log('Stopping existing video track...')
        this.videoTrack.stop()
        console.log('Track stopped, removing from stream...')
        if (this.stream) {
          this.stream.removeTrack(this.videoTrack)
        }
        this.videoTrack = null
        console.log('Video track removed and nullified')
      } else {
        console.log('Creating new video track...')
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: this.defaultConstraints.video,
        })

        this.videoTrack = videoStream.getVideoTracks()[0]
        console.log('New video track created:', {
          id: this.videoTrack.id,
          enabled: this.videoTrack.enabled,
        })

        if (this.stream) {
          console.log('Adding track to existing stream...')
          this.stream.addTrack(this.videoTrack)
        } else {
          console.log('Creating new stream with video track...')
          this.stream = new MediaStream([this.videoTrack])
          if (this.audioTrack) {
            this.stream.addTrack(this.audioTrack)
          }
        }
      }

      this.updateState()
      this.logStreamState('After -')
      console.groupEnd()
    } catch (error) {
      console.error('Error in toggleVideo:', error)
      this.handleError(error)
    }
  }

  async toggleAudio(): Promise<void> {
    try {
      console.log('Toggling audio...')
      this.logStreamState('Before audio toggle -')

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
      this.logStreamState('After audio toggle -')
    } catch (error) {
      console.error('Error toggling audio:', error)
      this.handleError(error)
    }
  }

  cleanup(): void {
    console.group('Cleanup Operation')
    console.log('Starting cleanup...')
    this.logStreamState('Before cleanup -')

    if (this.videoTrack) {
      console.log('Stopping video track...')
      this.videoTrack.stop()
      this.videoTrack = null
    }

    if (this.audioTrack) {
      console.log('Stopping audio track...')
      this.audioTrack.stop()
      this.audioTrack = null
    }

    if (this.stream) {
      console.log('Stopping all tracks in stream...')
      this.stream.getTracks().forEach((track) => {
        console.log(`Stopping track: ${track.kind} (${track.id})`)
        track.stop()
      })
      this.stream = null
    }

    this.updateState()
    console.log('Cleanup complete')
    this.logStreamState('After cleanup -')
    console.groupEnd()
  }

  private handleError(error: unknown): never {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Media stream error: ${message}`)
  }
}
