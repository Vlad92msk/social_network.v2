import { EventEmitter } from 'events'

export interface MediaStreamOptions {
  audio?: boolean;
  video?: boolean;
  videoConstraints?: MediaTrackConstraints;
  audioConstraints?: MediaTrackConstraints;
}

interface MediaStreamEvents {
  // Состояние медиа изменилось
  stateChanged: {
    stream: MediaStream | null;
    hasVideo: boolean;
    hasAudio: boolean;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
  };
  // Произошла ошибка
  error: Error;
}

export class MediaStreamManager extends EventEmitter {
  private stream: MediaStream | null = null

  private constraints: MediaStreamConstraints = { audio: false, video: false }

  private isVideoEnabled = false

  private isAudioEnabled = false

  /**
   * Инициализация менеджера с начальными настройками
   */
  async init(options: MediaStreamOptions): Promise<void> {
    try {
      // Формируем ограничения для медиа устройств
      this.constraints = {
        video: options.video
          ? {
            facingMode: 'user',
            ...(options.videoConstraints || {}),
          }
          : false,
        audio: options.audio
          ? {
            ...(options.audioConstraints || {}),
          }
          : false,
      }

      // Если запрошены какие-то медиа - запускаем стрим
      if (options.video || options.audio) {
        await this.startStream()
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Ошибка инициализации'))
      throw error
    }
  }

  /**
   * Запуск медиа потока с текущими ограничениями
   */
  private async startStream(): Promise<void> {
    try {
      // Останавливаем текущий стрим если есть
      this.stopStream()

      // Получаем новый медиа поток
      const stream = await navigator.mediaDevices.getUserMedia(this.constraints)
      this.stream = stream

      // Устанавливаем начальное состояние треков
      if (this.constraints.video) {
        this.isVideoEnabled = true
        stream.getVideoTracks().forEach((track) => track.enabled = true)
      }

      if (this.constraints.audio) {
        this.isAudioEnabled = true
        stream.getAudioTracks().forEach((track) => track.enabled = true)
      }

      this.emitState()
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Ошибка получения медиа потока'))
      throw error
    }
  }

  /**
   * Включение видео
   */
  async enableVideo(): Promise<void> {
    try {
      if (!this.stream || this.stream.getVideoTracks().length === 0) {
        // Если нет видео трека - запрашиваем его
        this.constraints.video = this.constraints.video || { facingMode: 'user' }
        await this.startStream()
      } else {
        // Если есть - включаем
        this.stream.getVideoTracks().forEach((track) => track.enabled = true)
        this.isVideoEnabled = true
        this.emitState()
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Ошибка включения видео'))
      throw error
    }
  }

  /**
   * Выключение видео
   */
  disableVideo(): void {
    if (this.stream) {
      this.stream.getVideoTracks().forEach((track) => track.enabled = false)
      this.isVideoEnabled = false
      this.emitState()
    }
  }

  /**
   * Переключение состояния видео
   */
  async toggleVideo(): Promise<void> {
    if (this.isVideoEnabled) {
      this.disableVideo()
    } else {
      await this.enableVideo()
    }
  }

  /**
   * Включение аудио
   */
  async enableAudio(): Promise<void> {
    try {
      if (!this.stream || this.stream.getAudioTracks().length === 0) {
        // Если нет аудио трека - запрашиваем его
        this.constraints.audio = this.constraints.audio || true
        await this.startStream()
      } else {
        // Если есть - включаем
        this.stream.getAudioTracks().forEach((track) => track.enabled = true)
        this.isAudioEnabled = true
        this.emitState()
      }
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Ошибка включения аудио'))
      throw error
    }
  }

  /**
   * Выключение аудио
   */
  disableAudio(): void {
    if (this.stream) {
      this.stream.getAudioTracks().forEach((track) => track.enabled = false)
      this.isAudioEnabled = false
      this.emitState()
    }
  }

  /**
   * Переключение состояния аудио
   */
  async toggleAudio(): Promise<void> {
    if (this.isAudioEnabled) {
      this.disableAudio()
    } else {
      await this.enableAudio()
    }
    this.emitState()
  }

  /**
   * Получение текущего медиа потока
   */
  getStream(): MediaStream | null {
    return this.stream
  }

  /**
   * Остановка медиа потока
   */
  stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = null
      this.isVideoEnabled = false
      this.isAudioEnabled = false
      this.emitState()
    }
  }

  /**
   * Получение текущего видео трека
   */
  getVideoTrack(): MediaStreamTrack | null {
    return this.stream?.getVideoTracks()[0] || null
  }

  /**
   * Получение текущего аудио трека
   */
  getAudioTrack(): MediaStreamTrack | null {
    return this.stream?.getAudioTracks()[0] || null
  }

  /**
   * Создание нового видео трека с указанным deviceId
   */
  async createVideoTrack(deviceId: string): Promise<MediaStreamTrack | null> {
    try {
      const currentConstraints = this.constraints.video as MediaTrackConstraints

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...currentConstraints,
          deviceId: { exact: deviceId },
        },
      })

      const videoTrack = stream.getVideoTracks()[0]

      if (!videoTrack) {
        throw new Error('Не удалось получить видео трек')
      }

      // Если уже есть видео трек - останавливаем его
      this.getVideoTrack()?.stop()

      // Если есть стрим - заменяем в нем видео трек
      if (this.stream) {
        const oldTrack = this.getVideoTrack()
        if (oldTrack) {
          this.stream.removeTrack(oldTrack)
        }
        this.stream.addTrack(videoTrack)
      } else {
        // Если стрима нет - создаем новый
        this.stream = stream
      }

      this.isVideoEnabled = true
      this.emitState()

      return videoTrack
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Ошибка создания видео трека'))
      return null
    }
  }

  /**
   * Создание нового аудио трека с указанным deviceId
   */
  async createAudioTrack(deviceId: string): Promise<MediaStreamTrack | null> {
    try {
      const currentConstraints = this.constraints.audio as MediaTrackConstraints

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          ...currentConstraints,
          deviceId: { exact: deviceId },
        },
      })

      const audioTrack = stream.getAudioTracks()[0]

      if (!audioTrack) {
        throw new Error('Не удалось получить аудио трек')
      }

      // Если уже есть аудио трек - останавливаем его
      this.getAudioTrack()?.stop()

      // Если есть стрим - заменяем в нем аудио трек
      if (this.stream) {
        const oldTrack = this.getAudioTrack()
        if (oldTrack) {
          this.stream.removeTrack(oldTrack)
        }
        this.stream.addTrack(audioTrack)
      } else {
        // Если стрима нет - создаем новый
        this.stream = stream
      }

      this.isAudioEnabled = true
      this.emitState()

      return audioTrack
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error('Ошибка создания аудио трека'))
      return null
    }
  }

  /**
   * Получение списка доступных видео устройств
   */
  async getVideoDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((device) => device.kind === 'videoinput')
  }

  /**
   * Получение списка доступных аудио устройств
   */
  async getAudioDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices()
    return devices.filter((device) => device.kind === 'audioinput')
  }

  /**
   * Получение текущего состояния
   */
  getState() {
    return {
      stream: this.stream,
      // @ts-ignore
      hasVideo: this.stream?.getVideoTracks()?.length > 0,
      // @ts-ignore
      hasAudio: this.stream?.getAudioTracks()?.length > 0,
      isVideoEnabled: this.isVideoEnabled,
      isAudioEnabled: this.isAudioEnabled,
    }
  }

  /**
   * Уничтожение менеджера
   */
  destroy(): void {
    this.stopStream()
    this.removeAllListeners()
  }

  /**
   * Отправка события изменения состояния
   */
  private emitState(): void {
    this.emit('stateChanged', this.getState())
  }
}
