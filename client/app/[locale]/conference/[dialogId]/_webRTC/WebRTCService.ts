import { EventEmitter } from 'events'
import { MediaStreamManager } from './MediaStreamManager'
import { PeerConnectionManager } from './PeerConnectionManager'
import { SignalingHandler } from './SignalingHandler'
import { MediaType, WebRTCConfig } from './types'
import { WebRTCError } from './utils/errors'
import { WebRTCLogger } from './utils/logger'
import { WebRTCMetrics } from './utils/metrics'

/**
 * WebRTCService отвечает за управление WebRTC соединениями и медиапотоками.
 * Наследуется от EventEmitter для поддержки событийной модели.
 *
 * События, которые генерирует сервис:
 * - 'localStreamChanged' - изменился локальный поток
 * - 'streamAdded' - добавлен новый удаленный поток
 * - 'peerStatusChanged' - изменился статус соединения с пиром
 * - 'peerDisconnected' - пир отключился
 * - 'error' - произошла ошибка
 * - 'iceCandidate' - появился новый ICE кандидат
 * - 'answer' - создан ответ на offer
 */
// services/webrtc/WebRTCService.ts
export class WebRTCService extends EventEmitter {
  private peerManager: PeerConnectionManager

  private mediaManager: MediaStreamManager

  private signalingHandler: SignalingHandler

  private logger: WebRTCLogger

  private metrics: WebRTCMetrics

  constructor(config: WebRTCConfig) {
    super()
    this.peerManager = new PeerConnectionManager(config)
    this.mediaManager = new MediaStreamManager()
    this.signalingHandler = new SignalingHandler(this.peerManager, this.mediaManager)
    this.logger = new WebRTCLogger(config.debug)
    this.metrics = new WebRTCMetrics()

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    // Обработчики для peer connections
    this.setupPeerConnectionHandlers()

    // Обработчики для медиа стримов
    this.setupMediaStreamHandlers()

    // Обработчики для сетевых событий
    this.setupNetworkHandlers()

    // Обработчики для метрик и статистики
    this.setupMetricsHandlers()
  }

  private setupPeerConnectionHandlers() {
    // Обработка изменений состояния ICE соединения
    const handleIceConnectionChange = (peerId: string, connection: RTCPeerConnection) => {
      connection.oniceconnectionstatechange = () => {
        const state = connection.iceConnectionState
        this.logger.log(`ICE Connection state changed for peer ${peerId}:`, state)

        switch (state) {
          case 'checking':
            this.emit('peerStatus', { peerId, status: 'connecting' })
            break
          case 'connected':
            this.emit('peerStatus', { peerId, status: 'connected' })
            break
          case 'disconnected':
            this.emit('peerStatus', { peerId, status: 'disconnected' })
            this.handleDisconnection(peerId)
            break
          case 'failed':
            this.emit('error', WebRTCError.connectionFailed(peerId))
            this.attemptReconnection(peerId)
            break
        }
      }
    }

    // Обработка новых треков
    const handleTrack = (peerId: string, connection: RTCPeerConnection) => {
      connection.ontrack = (event) => {
        this.logger.log(`New track received from peer ${peerId}:`, event.track.kind)

        const [stream] = event.streams
        if (stream) {
          // Определяем тип медиа и сохраняем поток
          const mediaType = this.determineMediaType(event.track)
          this.emit('streamReceived', { peerId, mediaType, stream })

          // Устанавливаем обработчики для трека
          event.track.onended = () => {
            this.emit('trackEnded', { peerId, mediaType })
          }

          event.track.onmute = () => {
            this.emit('trackMuted', { peerId, mediaType })
          }

          event.track.onunmute = () => {
            this.emit('trackUnmuted', { peerId, mediaType })
          }
        }
      }
    }

    // Применяем обработчики ко всем пирам
    this.peerManager.getPeers().forEach(([peerId, peer]) => {
      handleIceConnectionChange(peerId, peer.connection)
      handleTrack(peerId, peer.connection)
    })
  }

  private setupMediaStreamHandlers() {
    // Обработка изменений в локальных медиа-потоках
    const handleLocalStreamChange = (type: MediaType, stream: MediaStream | null) => {
      this.logger.log(`Local ${type} stream changed:`, stream?.id)

      if (stream) {
        // Отслеживаем состояние треков
        stream.getTracks().forEach((track) => {
          track.onended = () => {
            this.emit('localTrackEnded', { type, trackId: track.id })
          }

          track.onmute = () => {
            this.emit('localTrackMuted', { type, trackId: track.id })
          }

          track.onunmute = () => {
            this.emit('localTrackUnmuted', { type, trackId: track.id })
          }
        })

        // Обновляем все активные соединения
        this.peerManager.getPeers().forEach(([peerId, peer]) => {
          this.updatePeerStream(peerId, type, stream).catch((error) => {
            this.logger.error(`Failed to update stream for peer ${peerId}:`, error)
          })
        })
      }
    }

    // Подписываемся на изменения медиа-потоков
    this.mediaManager.on('streamChanged', handleLocalStreamChange)
  }

  private setupNetworkHandlers() {
    // Обработка изменений состояния сети
    window.addEventListener('online', () => {
      this.logger.log('Network connection restored')
      this.handleNetworkReconnection()
    })

    window.addEventListener('offline', () => {
      this.logger.log('Network connection lost')
      this.emit('networkStatus', { status: 'offline' })
    })

    // Мониторинг качества соединения
    const checkConnectionQuality = () => {
      this.peerManager.getPeers().forEach(([peerId, peer]) => {
        peer.connection.getStats().then((stats) => {
          const quality = this.analyzeConnectionQuality(stats)
          this.emit('connectionQuality', { peerId, quality })
        })
      })
    }

    // Проверяем качество каждые 5 секунд
    setInterval(checkConnectionQuality, 5000)
  }

  private setupMetricsHandlers() {
    // Сбор метрик по использованию полосы пропускания
    const trackBandwidthUsage = (peerId: string, connection: RTCPeerConnection) => {
      let lastBytesSent = 0
      let lastBytesReceived = 0

      setInterval(async () => {
        const stats = await connection.getStats()
        let totalBytesSent = 0
        let totalBytesReceived = 0

        stats.forEach((stat) => {
          if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
            totalBytesSent += stat.bytesSent
            totalBytesReceived += stat.bytesReceived
          }
        })

        const bandwidthUsage = {
          upload: totalBytesSent - lastBytesSent,
          download: totalBytesReceived - lastBytesReceived,
        }

        this.emit('bandwidthUsage', { peerId, ...bandwidthUsage })

        lastBytesSent = totalBytesSent
        lastBytesReceived = totalBytesReceived
      }, 1000)
    }

    // Применяем отслеживание метрик ко всем пирам
    this.peerManager.getPeers().forEach(([peerId, peer]) => {
      trackBandwidthUsage(peerId, peer.connection)
    })
  }

  // Вспомогательные методы
  private async handleDisconnection(peerId: string) {
    this.logger.log(`Handling disconnection for peer ${peerId}`)
    // Попытка переподключения или очистка ресурсов
  }

  private async attemptReconnection(peerId: string) {
    this.logger.log(`Attempting to reconnect with peer ${peerId}`)
    // Логика переподключения
  }

  private async handleNetworkReconnection() {
    this.logger.log('Handling network reconnection')
    // Восстановление всех соединений
  }

  private analyzeConnectionQuality(stats: RTCStatsReport) {
    // Анализ качества соединения на основе статистики
    let quality: 'good' | 'medium' | 'poor' = 'good'
    stats.forEach((stat) => {
      if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
        if (stat.availableOutgoingBitrate < 1000000) {
          quality = 'poor'
        } else if (stat.availableOutgoingBitrate < 2000000) {
          quality = 'medium'
        }
      }
    })
    return quality
  }

  private determineMediaType(track: MediaStreamTrack): MediaType {
    if (track.kind === 'video') {
      // Можно добавить логику определения screen share по параметрам видео
      return track.label.includes('screen') ? 'screen' : 'video'
    }
    return 'audio'
  }
}


export class WebRTCService1 {
  private peerManager: PeerConnectionManager
  private signalingHandler: SignalingHandler

  constructor(config: WebRTCConfig) {
    super()
    this.peerManager = new PeerConnectionManager(config)
    this.signalingHandler = new SignalingHandler(this.peerManager)

    this.setupEventHandlers()
  }

  private setupEventHandlers() {
    // Обработчики для peer connections
    this.setupPeerConnectionHandlers()
  }
}


export class WebRTCManager {
  //...
  private peerManager: PeerConnectionManager

  constructor(config: WebRTCConfig) {
    this.peerManager = new PeerConnectionManager(config)
  }
//...
}
