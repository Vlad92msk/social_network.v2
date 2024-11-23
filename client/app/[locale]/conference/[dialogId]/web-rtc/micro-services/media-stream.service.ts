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

  init(options: MediaStreamOptions): void {
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

      console.log('Starting stream with constraints:', this.#constraints)

      // Убедимся что хотя бы одно из устройств запрашивается
      const constraints = {
        ...this.#constraints,
        video: this.#constraints.video === false ? false : {
          facingMode: 'user',
          ...(this.#constraints.video as MediaTrackConstraints),
        },
        audio: this.#constraints.audio === false ? false : {
          ...(this.#constraints.audio as MediaTrackConstraints),
        },
      }

      console.log('Processed constraints:', constraints)

      if (!constraints.audio && !constraints.video) {
        throw new Error('At least one of audio or video must be enabled')
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('Got media stream:', {
        audioTracks: mediaStream.getAudioTracks().length,
        videoTracks: mediaStream.getVideoTracks().length
      })

      // Если уже есть старый стрим, останавливаем его
      if (this.#stream) {
        this.#stream.getTracks().forEach((track) => track.stop())
      }

      this.#stream = mediaStream

      // Устанавливаем начальное состояние треков
      const videoTracks = mediaStream.getVideoTracks()
      const audioTracks = mediaStream.getAudioTracks()

      console.log('Setting initial track states:', {
        videoTracksCount: videoTracks.length,
        audioTracksCount: audioTracks.length,
        isVideoEnabled: this.#isVideoEnabled,
        isAudioEnabled: this.#isAudioEnabled
      })

      videoTracks.forEach((track) => {
        track.enabled = this.#isVideoEnabled
      })

      audioTracks.forEach((track) => {
        track.enabled = this.#isAudioEnabled
      })

      this.emit('streamStarted', mediaStream)
      this.emit('stateChanged', this.getState())
    } catch (err) {
      console.error('Start stream error:', err)
      const error = err instanceof Error ? err : new Error('Failed to get media stream')
      this.emit('error', error)
      throw error
    }
  }

  stopStream(): void {
    this.#checkInitialized()

    if (this.#stream) {
      this.#stream.getTracks().forEach((track) => track.stop())
      this.emit('streamStopped', { streamId: this.#stream.id })

      this.#stream = undefined
      this.emit('stateChanged', this.getState())
    }
  }

  async toggleVideo(): Promise<void> {
    this.#checkInitialized()

    try {
      if (!this.#stream) {
        // Обновляем constraints перед созданием стрима
        this.updateConstraints({
          video: true,  // включаем видео
          audio: !!this.#constraints?.audio, // сохраняем текущее состояние аудио
          videoConstraints: { facingMode: 'user' }
        })
        this.#isVideoEnabled = true
        await this.startStream()
      } else {
        // Если стрим есть, переключаем состояние видео треков
        const videoTracks = this.#stream.getVideoTracks()
        if (videoTracks.length > 0) {
          this.#isVideoEnabled = !this.#isVideoEnabled
          videoTracks.forEach((track) => {
            track.enabled = this.#isVideoEnabled
          })
          this.emit('videoToggled', {
            active: this.#isVideoEnabled,
            streamId: this.#stream.id,
          })
          this.emit('stateChanged', this.getState())
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to toggle video')
      this.emit('error', error)
      throw error
    }
  }

  async toggleAudio(): Promise<void> {
    this.#checkInitialized()

    try {
      if (!this.#stream) {
        // Только если стрима вообще нет, создаем новый
        this.updateConstraints({
          audio: true,
          video: !!this.#constraints?.video,
          audioConstraints: {}
        })
        this.#isAudioEnabled = true
        await this.startStream()
      } else {
        // Иначе работаем с существующим стримом
        const audioTracks = this.#stream.getAudioTracks()

        if (audioTracks.length === 0) {
          // Если нет аудио треков, получаем только аудио стрим и добавляем его треки
          const audioStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: false
          })
          audioStream.getAudioTracks().forEach(track => {
            this.#stream?.addTrack(track)
          })
          this.#isAudioEnabled = true
        } else {
          // Если есть аудио треки, просто переключаем их
          this.#isAudioEnabled = !this.#isAudioEnabled
          audioTracks.forEach(track => {
            track.enabled = this.#isAudioEnabled
          })
        }

        this.emit('audioToggled', {
          active: this.#isAudioEnabled,
          streamId: this.#stream.id,
        })
        this.emit('stateChanged', this.getState())
      }

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to toggle audio')
      this.emit('error', error)
      throw error
    }
  }

  updateConstraints(options: MediaStreamOptions): void {
    this.#checkInitialized()

    this.#constraints = {
      video: options.video ? {
        ...options.videoConstraints,
      } : false,
      audio: options.audio ? {
        ...options.audioConstraints,
      } : false,
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

    // Проверяем реальное состояние аудио трека
    if (this.#stream) {
      const audioTracks = this.#stream.getAudioTracks()
      if (audioTracks.length > 0) {
        this.#isAudioEnabled = audioTracks[0].enabled
      }
    }

    return {
      stream: this.#stream,
      isVideoEnabled: this.#isVideoEnabled,
      isAudioEnabled: this.#isAudioEnabled,
      error: null,
    }
  }
}
