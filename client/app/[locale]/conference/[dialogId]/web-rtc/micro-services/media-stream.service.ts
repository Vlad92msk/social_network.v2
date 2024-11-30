'use client'

import { EventEmitter } from 'events'

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
    if (typeof window !== 'undefined') { // Проверяем, что мы на клиенте
      this.deviceChangeListener = async () => {
        const devices = await this.getAvailableDevices()
        this.emit('deviceChange', devices)
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
    this.emit('trackEnded', track)
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
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      if (this.stream) {
        // Добавляем новые треки к существующему потоку
        stream.getTracks().forEach(track => {
          this.stream?.addTrack(track)
          track.addEventListener('ended', () => this.handleTrackEnded(track))
        })
      } else {
        this.stream = stream
        stream.getTracks().forEach(track => {
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
      videoTrack.stop()
      this.isVideoEnabled = false
      this.emitState()
    }
  }

  /**
   * Включает видеодорожку
   * Вызывать когда нужно включить видео
   */
  async enableVideo(): Promise<void> {
    try {
      await this.startStream({ ...this.getConstraints(), video: true })
    } catch (error) {
      this.handleError('Не удалось включить видео', error)
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
      this.emitState()
    }
  }

  /**
   * Включает аудиодорожку
   * Вызывать когда нужно включить микрофон
   */
  async enableAudio(): Promise<void> {
    try {
      if (!this.stream || !this.getAudioTrack()) {
        await this.startStream({ ...this.getConstraints(), audio: true })
      } else {
        const audioTrack = this.getAudioTrack()
        if (audioTrack) {
          audioTrack.enabled = true
          this.isAudioEnabled = true
          this.isAudioMuted = false
        }
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
    this.emit('error', finalError)
    throw finalError
  }

  private emitState(): void {
    this.emit('stateChanged', this.getState())
  }

  /**
   * Останавливает все медиапотоки
   * Вызывать для полной остановки всех медиапотоков
   */
  async stopStream(): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.enabled = false
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
