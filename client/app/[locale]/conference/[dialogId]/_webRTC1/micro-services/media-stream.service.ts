import { EventEmitter } from 'events'

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

export class MediaStreamManager extends EventEmitter {
  #stream?: MediaStream

  #isVideoEnabled = false

  #isAudioEnabled = false

  #constraints?: {
    video: false | MediaTrackConstraints
    audio: false | MediaTrackConstraints
  }

  #initialized = false

  init(options: MediaStreamOptions = { audio: false, video: true }): void {
    // Если уже инициализирован, сначала очищаем
    if (this.#initialized) {
      this.destroy()
    }

    this.#constraints = {
      video: options.video ? {
        ...options.videoConstraints,
      } : false,
      audio: options.audio ? {
        ...options.audioConstraints,
      } : false,
    }

    this.#isVideoEnabled = !!options.video
    this.#isAudioEnabled = !!options.audio
    this.#initialized = true

    // Уведомляем об инициализации
    this.emit('initialized', this.getState())
  }

  #checkInitialized(): void {
    if (!this.#initialized) {
      throw new Error('MediaStreamManager is not initialized. Call init() first.')
    }
  }

  async startStream(): Promise<void> {
    this.#checkInitialized()

    try {
      if (!this.#constraints) {
        throw new Error('Constraints are not set')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(this.#constraints)
      this.#stream = mediaStream
      this.#isVideoEnabled = true
      this.#isAudioEnabled = true

      // Уведомляем о начале стрима
      this.emit('streamStarted', mediaStream)
      this.emit('stateChanged', this.getState())
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to get media stream')
      this.emit('error', error)
      throw error
    }
  }

  stopStream(): void {
    this.#checkInitialized()

    if (this.#stream) {
      this.#stream.getTracks().forEach((track) => track.stop())
      this.#stream = undefined
      this.#isVideoEnabled = false
      this.#isAudioEnabled = false

      // Уведомляем об остановке стрима
      this.emit('streamStopped')
      this.emit('stateChanged', this.getState())
    }
  }

  async toggleVideo(): Promise<void> {
    this.#checkInitialized()

    try {
      if (!this.#stream) {
        await this.startStream()
        return
      }

      const videoTrack = this.#stream.getVideoTracks()[0]

      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        this.#isVideoEnabled = videoTrack.enabled
        this.emit('videoToggled', this.#isVideoEnabled)
      } else if (!videoTrack && this.#constraints?.video) {
        const newVideoStream = await navigator.mediaDevices.getUserMedia({
          video: this.#constraints.video,
        })

        const newVideoTrack = newVideoStream.getVideoTracks()[0]
        this.#stream.addTrack(newVideoTrack)
        this.#isVideoEnabled = true
        this.emit('videoToggled', true)
      }

      this.emit('stateChanged', this.getState())
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to toggle video')
      this.emit('error', error)
      throw error
    }
  }

  toggleAudio(): void {
    this.#checkInitialized()

    if (this.#stream) {
      const audioTrack = this.#stream.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        this.#isAudioEnabled = audioTrack.enabled
        this.emit('audioToggled', this.#isAudioEnabled)
        this.emit('stateChanged', this.getState())
      }
    }
  }

  destroy(): void {
    if (this.#initialized) {
      this.stopStream()
      this.removeAllListeners()
      this.#constraints = undefined
      this.#initialized = false
      this.emit('destroyed')
    }
  }

  getState(): MediaStreamState {
    this.#checkInitialized()
    return {
      stream: this.#stream,
      isVideoEnabled: this.#isVideoEnabled,
      isAudioEnabled: this.#isAudioEnabled,
      error: null,
    }
  }
}