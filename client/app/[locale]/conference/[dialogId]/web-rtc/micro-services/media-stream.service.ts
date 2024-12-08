'use client'

import { EventEmitter } from 'events'

export enum MediaEvents {
  STATE_CHANGED = 'stateChanged',
  TRACK_ADDED = 'trackAdded', // Новый трек добавлен
  TRACK_REMOVED = 'trackRemoved', // Трек удален
  TRACK_MUTED = 'trackMuted', // Трек заглушен
  TRACK_UNMUTED = 'trackUnmuted', // Трек включен
  DEVICE_CHANGED = 'deviceChanged', // Сменилось устройство
  ERROR = 'error'
}

export interface MediaStreamOptions {
  // Основные настройки устройств
  audio?: boolean;
  video?: boolean;
  videoConstraints?: MediaTrackConstraints;
  audioConstraints?: MediaTrackConstraints;

  // Настройки видео элемента
  autoPlay?: boolean;
  muted?: boolean;
  volume?: number;

  // Выбор устройств
  preferredVideoDeviceId?: string;
  preferredAudioDeviceId?: string;

  // Расширенные настройки
  echoCancellation?: boolean; // Подавление эха
  noiseSuppression?: boolean; // Подавление шума
  autoGainControl?: boolean; // Автоматическая регулировка усиления
  facingMode?: 'user' | 'environment'; // Выбор камеры (фронтальная или основная)
  frameRate?: number; // Частота кадров
  aspectRatio?: number; // Соотношение сторон
  width?: number; // Ширина видео
  height?: number; // Высота видео
}

export interface MediaStreamState {
  stream: MediaStream | null; // Текущий медиапоток
  hasVideo: boolean; // Есть ли видеодорожка
  hasAudio: boolean; // Есть ли аудиодорожка
  isVideoEnabled: boolean; // Включено ли видео
  isAudioEnabled: boolean; // Включено ли аудио
  isVideoMuted: boolean; // Заглушено ли видео
  isAudioMuted: boolean; // Заглушено ли аудио
  currentVideoDevice: string | null; // ID текущего видеоустройства
  currentAudioDevice: string | null; // ID текущего аудиоустройства
  volume: number; // Громкость
  videoSettings: MediaTrackSettings | null; // Настройки видеодорожки
  audioSettings: MediaTrackSettings | null; // Настройки аудиодорожки
}

export class MediaStreamManager extends EventEmitter {
  private stream: MediaStream | null = null

  private options: MediaStreamOptions

  private isVideoEnabled = false

  private isAudioEnabled = false

  private isVideoMuted = false

  private isAudioMuted = false

  private volume = 1

  private deviceChangeListener: (() => void) | null = null

  constructor() {
    super()
    this.options = {}
    this.setupDeviceChangeListener()
  }

  /**
   * Устанавливает слушатель изменения устройств
   * Вызывается автоматически при создании экземпляра класса
   */
  private setupDeviceChangeListener(): void {
    if (typeof window !== 'undefined') {
      this.deviceChangeListener = async () => {
        const devices = await this.getAvailableDevices()
        this.emit(MediaEvents.DEVICE_CHANGED, devices)
      }

      navigator.mediaDevices?.addEventListener('devicechange', this.deviceChangeListener)
    }
  }

  /**
   * Инициализирует медиа-менеджер с заданными настройками
   * Вызывать при первом запуске или для полной переинициализации
   * @param options - Настройки медиапотока
   */
  async init(options: MediaStreamOptions): Promise<void> {
    try {
      this.options = {
        autoPlay: true,
        muted: false,
        volume: 1,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...options,
      }

      this.volume = this.options.volume!

      const constraints: MediaStreamConstraints = {
        video: options.video ? {
          deviceId: options.preferredVideoDeviceId ? { exact: options.preferredVideoDeviceId } : undefined,
          facingMode: options.facingMode || 'user',
          width: options.width,
          height: options.height,
          aspectRatio: options.aspectRatio,
          frameRate: options.frameRate,
          ...options.videoConstraints,
        } : false,
        audio: options.audio ? {
          deviceId: options.preferredAudioDeviceId ? { exact: options.preferredAudioDeviceId } : undefined,
          echoCancellation: options.echoCancellation,
          noiseSuppression: options.noiseSuppression,
          autoGainControl: options.autoGainControl,
          ...options.audioConstraints,
        } : false,
      }

      if (options.video || options.audio) {
        await this.startStream(constraints)
      }
    } catch (error) {
      this.handleError('Ошибка инициализации', error)
    }
  }

  /**
   * Обработчик завершения медиадорожки
   * Внутренний метод, вызывается автоматически
   */
  private handleTrackEnded(track: MediaStreamTrack): void {
    this.emit(MediaEvents.TRACK_REMOVED, { kind: track.kind, track })
    if (track.kind === 'video') {
      this.isVideoEnabled = false
    } else if (track.kind === 'audio') {
      this.isAudioEnabled = false
    }
    this.emitState()
  }

  /**
   * Запускает медиапоток с заданными ограничениями
   * Внутренний метод, вызывается автоматически
   */
  private async startStream(constraints: MediaStreamConstraints): Promise<void> {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia(constraints)

      if (this.stream) {
        // Сначала удаляем все нужные треки
        newStream.getTracks().forEach((newTrack) => {
          const existingTrack = this.stream?.getTracks().find((t) => t.kind === newTrack.kind)
          if (existingTrack) {
            existingTrack.stop()
            this.stream?.removeTrack(existingTrack)
            this.emit(MediaEvents.TRACK_REMOVED, { kind: existingTrack.kind, track: existingTrack })
          }
        })

        // Потом добавляем новые
        newStream.getTracks().forEach((newTrack) => {
          this.stream?.addTrack(newTrack)
          this.emit(MediaEvents.TRACK_ADDED, { kind: newTrack.kind, track: newTrack, stream: this.stream })
          newTrack.addEventListener('ended', () => this.handleTrackEnded(newTrack))
        })
      } else {
        this.stream = newStream
        newStream.getTracks().forEach((track) => {
          this.emit(MediaEvents.TRACK_ADDED, { kind: track.kind, track, stream: newStream })
          track.addEventListener('ended', () => this.handleTrackEnded(track))
        })
      }

      if (constraints.video) {
        this.isVideoEnabled = true
        this.isVideoMuted = false
      }

      if (constraints.audio) {
        this.isAudioEnabled = true
        this.isAudioMuted = false
      }

      this.emitState()
    } catch (error) {
      this.handleError('Не удалось запустить поток', error)
    }
  }

  /**
   * Отключает видеодорожку
   * Вызывать когда нужно полностью выключить видео
   */
  disableVideo(): void {
    const videoTrack = this.getVideoTrack()
    if (videoTrack) {
      videoTrack.enabled = false
      this.stream?.removeTrack(videoTrack)
      this.emit(MediaEvents.TRACK_REMOVED, { kind: 'video', track: videoTrack })
      videoTrack.stop()
      this.isVideoEnabled = false
      this.emitState()
    }
  }

  private async addTrackToStream(kind: 'audio' | 'video'): Promise<MediaStreamTrack> {
    const constraints = {
      [kind]: kind === 'video' ? {
        facingMode: this.options.facingMode,
        width: this.options.width,
        height: this.options.height,
        aspectRatio: this.options.aspectRatio,
        frameRate: this.options.frameRate,
        deviceId: this.options.preferredVideoDeviceId,
        ...this.options.videoConstraints,
      } : {
        echoCancellation: this.options.echoCancellation,
        noiseSuppression: this.options.noiseSuppression,
        autoGainControl: this.options.autoGainControl,
        deviceId: this.options.preferredAudioDeviceId,
        ...this.options.audioConstraints,
      }
    }

    const tempStream = await navigator.mediaDevices.getUserMedia(constraints)
    const track = tempStream.getTracks()[0]

    // Создаем основной поток, если его еще нет
    if (!this.stream) {
      this.stream = new MediaStream()
    }

    return track
  }

  async enableVideo(): Promise<void> {
    try {
      const existingTrack = this.getVideoTrack()
      if (!existingTrack) {
        const videoTrack = await this.addTrackToStream('video')
        this.stream!.addTrack(videoTrack)
        this.emit(MediaEvents.TRACK_ADDED, { kind: 'video', track: videoTrack, stream: this.stream })
        videoTrack.addEventListener('ended', () => this.handleTrackEnded(videoTrack))
        this.isVideoEnabled = true
        this.isVideoMuted = false
      } else {
        existingTrack.enabled = true
        this.isVideoEnabled = true
        this.isVideoMuted = false
        this.emit(MediaEvents.TRACK_UNMUTED, { kind: 'video', track: existingTrack })
      }
      this.emitState()
    } catch (error) {
      this.handleError('Не удалось включить видео', error)
    }
  }

  async enableAudio(): Promise<void> {
    try {
      const existingTrack = this.getAudioTrack()
      if (!existingTrack) {
        const audioTrack = await this.addTrackToStream('audio')
        this.stream!.addTrack(audioTrack)
        this.emit(MediaEvents.TRACK_ADDED, { kind: 'audio', track: audioTrack, stream: this.stream })
        audioTrack.addEventListener('ended', () => this.handleTrackEnded(audioTrack))
        this.isAudioEnabled = true
        this.isAudioMuted = false
      } else {
        existingTrack.enabled = true
        this.isAudioEnabled = true
        this.isAudioMuted = false
        this.emit(MediaEvents.TRACK_UNMUTED, { kind: 'audio', track: existingTrack })
      }
      this.emitState()
    } catch (error) {
      this.handleError('Не удалось включить аудио', error)
    }
  }

  /**
   * Отключает аудиодорожку
   * Вызывать когда нужно полностью выключить микрофон
   */
  disableAudio(): void {
    const audioTrack = this.getAudioTrack()
    if (audioTrack) {
      audioTrack.enabled = false
      this.stream?.removeTrack(audioTrack)
      this.emit(MediaEvents.TRACK_REMOVED, { kind: 'audio', track: audioTrack })
      audioTrack.stop()
      this.isAudioEnabled = false
      this.emitState()
    }
  }

  /**
   * Временно отключает аудио (без остановки дорожки)
   * Вызывать для временного отключения микрофона
   */
  muteAudio(): void {
    const audioTrack = this.getAudioTrack()
    if (audioTrack) {
      audioTrack.enabled = false
      this.isAudioMuted = true
      this.emit(MediaEvents.TRACK_MUTED, { kind: 'audio', track: audioTrack })
      this.emitState()
    }
  }

  /**
   * Возобновляет передачу аудио
   * Вызывать для возобновления передачи после mute
   */
  unmuteAudio(): void {
    const audioTrack = this.getAudioTrack()
    if (audioTrack) {
      audioTrack.enabled = true
      this.isAudioMuted = false
      this.emit(MediaEvents.TRACK_UNMUTED, { kind: 'audio', track: audioTrack })
      this.emitState()
    }
  }

  /**
   * Временно отключает видео (без остановки дорожки)
   * Вызывать для временного отключения видео
   */
  muteVideo(): void {
    const videoTrack = this.getVideoTrack()
    if (videoTrack) {
      videoTrack.enabled = false
      this.isVideoMuted = true
      this.emit(MediaEvents.TRACK_MUTED, { kind: 'video', track: videoTrack })
      this.emitState()
    }
  }

  /**
   * Возобновляет передачу видео
   * Вызывать для возобновления передачи после mute
   */
  unmuteVideo(): void {
    const videoTrack = this.getVideoTrack()
    if (videoTrack) {
      videoTrack.enabled = true
      this.isVideoMuted = false
      this.emit(MediaEvents.TRACK_UNMUTED, { kind: 'video', track: videoTrack })
      this.emitState()
    }
  }

  /**
   * Устанавливает громкость
   * Вызывать для изменения громкости (значение от 0 до 1)
   */
  setVolume(value: number): void {
    this.volume = Math.max(0, Math.min(1, value))
    this.emitState()
  }

  /**
   * Переключает видеоустройство
   * Вызывать при необходимости сменить камеру
   */
  async switchVideoDevice(deviceId: string): Promise<void> {
    try {
      const constraints = this.getConstraints()
      if (constraints.video && typeof constraints.video === 'object') {
        constraints.video.deviceId = { exact: deviceId }
        await this.startStream(constraints)
      }
    } catch (error) {
      this.handleError('Не удалось переключить видеоустройство', error)
    }
  }

  /**
   * Переключает аудиоустройство
   * Вызывать при необходимости сменить микрофон
   */
  async switchAudioDevice(deviceId: string): Promise<void> {
    try {
      const constraints = this.getConstraints()
      if (constraints.audio && typeof constraints.audio === 'object') {
        constraints.audio.deviceId = { exact: deviceId }
        await this.startStream(constraints)
      }
    } catch (error) {
      this.handleError('Не удалось переключить аудиоустройство', error)
    }
  }

  /**
   * Получает список доступных устройств
   * Вызывать для получения списка доступных камер и микрофонов
   */
  async getAvailableDevices(): Promise<{ video: MediaDeviceInfo[], audio: MediaDeviceInfo[] }> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return {
        video: devices.filter((device) => device.kind === 'videoinput'),
        audio: devices.filter((device) => device.kind === 'audioinput'),
      }
    } catch (error) {
      this.handleError('Не удалось получить список устройств', error)
      return { video: [], audio: [] }
    }
  }

  /**
   * Получает текущую видеодорожку
   * Вызывать для получения информации о текущей видеодорожке
   */
  getVideoTrack(): MediaStreamTrack | null {
    return this.stream?.getVideoTracks()[0] || null
  }

  /**
   * Получает текущую аудиодорожку
   * Вызывать для получения информации о текущей аудиодорожке
   */
  getAudioTrack(): MediaStreamTrack | null {
    return this.stream?.getAudioTracks()[0] || null
  }

  /**
   * Получает текущий медиапоток
   * Вызывать для получения всего медиапотока
   */
  getStream(): MediaStream | null {
    return this.stream
  }

  /**
   * Получает текущее состояние
   * Вызывать для получения полной информации о текущем состоянии
   */
  getState(): MediaStreamState {
    return {
      stream: this.stream,
      hasVideo: Boolean(this.getVideoTrack()),
      hasAudio: Boolean(this.getAudioTrack()),
      isVideoEnabled: this.isVideoEnabled,
      isAudioEnabled: this.isAudioEnabled,
      isVideoMuted: this.isVideoMuted,
      isAudioMuted: this.isAudioMuted,
      currentVideoDevice: this.getVideoTrack()?.getSettings().deviceId || null,
      currentAudioDevice: this.getAudioTrack()?.getSettings().deviceId || null,
      volume: this.volume,
      videoSettings: this.getVideoTrack()?.getSettings() || null,
      audioSettings: this.getAudioTrack()?.getSettings() || null,
    }
  }

  private getConstraints(): MediaStreamConstraints {
    return {
      video: this.isVideoEnabled ? (this.options.video || true) : false,
      audio: this.isAudioEnabled ? (this.options.audio || true) : false,
    }
  }

  private handleError(message: string, error: unknown): void {
    const finalError = error instanceof Error ? error : new Error(message)
    this.emit(MediaEvents.ERROR, finalError)
    throw finalError
  }

  private emitState(): void {
    this.emit(MediaEvents.STATE_CHANGED, this.getState())
  }

  /**
   * Останавливает все медиапотоки
   * Вызывать для полной остановки всех медиапотоков
   */
  async stopStream(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.enabled = false
        this.emit(MediaEvents.TRACK_REMOVED, { kind: track.kind, track })
        track.stop()
      })
      this.stream = null
      this.isVideoEnabled = false
      this.isAudioEnabled = false
      this.isVideoMuted = false
      this.isAudioMuted = false
      this.emitState()
    }
  }

  async destroy() {
    await this.stopStream()
    if (this.deviceChangeListener) {
      navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeListener)
    }
    this.removeAllListeners()
  }
}
