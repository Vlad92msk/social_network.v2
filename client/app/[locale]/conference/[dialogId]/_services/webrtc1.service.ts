// Интерфейс состояния WebRTC соединений
export interface WebRTCState {
  // Хранит MediaStream для каждого пользователя (ключ - ID пользователя)
  streams: Record<string, MediaStream | undefined>;
  // Флаг, указывающий что идет процесс установки соединения
  isConnecting: boolean;
  // Статус соединения для каждого пользователя
  connectionStatus: Record<string, RTCPeerConnectionState>;
}

// Тип для функции-слушателя изменений состояния
export type WebRTCStateListener = (state: WebRTCState) => void;

export class WebRTCManager {
  // Текущее состояние менеджера
  private state: WebRTCState = {
    streams: {},
    isConnecting: false,
    connectionStatus: {},
  }

  // Набор функций-слушателей для оповещения об изменениях состояния
  private listeners = new Set<WebRTCStateListener>()

  // Хранилище RTCPeerConnection для каждого пользователя
  private peerConnections: Record<string, RTCPeerConnection> = {}

  // Локальный медиапоток (аудио/видео) текущего пользователя
  private localStream?: MediaStream

  constructor(
    // ID текущего пользователя
    private currentUserId: string,
    // Функция для отправки сигнальных сообщений другим участникам
    private sendSignalCallback: (params: { targetUserId: string; signal: any; dialogId: string }) => void,
    // ID диалога/комнаты
    private dialogId?: string,
  ) {}

  // Обновление состояния с уведомлением всех слушателей
  private setState(newState: Partial<WebRTCState>) {
    this.state = {
      ...this.state,
      ...newState,
      // Сохраняем существующие стримы и статусы, которые не были изменены
      streams: { ...this.state.streams, ...(newState.streams || {}) },
      connectionStatus: { ...this.state.connectionStatus, ...(newState.connectionStatus || {}) },
    }
    // Уведомляем всех слушателей об изменении состояния
    this.listeners.forEach((listener) => listener(this.state))
  }

  // Установка локального медиапотока и обновление всех существующих соединений
  setLocalStream(stream?: MediaStream) {
    this.localStream = stream
    // Обновляем треки во всех существующих соединениях
    Object.entries(this.peerConnections).forEach(([userId, pc]) => {
      pc.getSenders().forEach((sender) => {
        // Находим соответствующий трек в новом стриме
        const track = stream?.getTracks().find((t) => t.kind === sender.track?.kind)
        if (track) sender.replaceTrack(track)
      })
    })
  }

  // Установка ID диалога/комнаты
  setDialogId(dialogId: string) {
    this.dialogId = dialogId
  }

  // Создание и настройка нового RTCPeerConnection
  private setupPeerConnection(targetUserId: string) {
    // Закрываем существующее соединение, если оно есть
    if (this.peerConnections[targetUserId]) {
      this.peerConnections[targetUserId].close()
      delete this.peerConnections[targetUserId]
      this.setState({
        streams: {
          ...this.state.streams,
          [targetUserId]: undefined,
        },
      })
    }

    // Создаем новое соединение с настройкой STUN-сервера
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    // Отслеживаем изменения состояния соединения
    pc.onconnectionstatechange = () => {
      console.log(`Состояние соединения с пользователем ID ${targetUserId}:`, pc.connectionState)

      this.setState({
        connectionStatus: {
          ...this.state.connectionStatus,
          [targetUserId]: pc.connectionState,
        },
      })

      // Обработка разрыва соединения
      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        console.log(`Соединение ${pc.connectionState} для пользователя ID ${targetUserId}, очищается`)
        pc.close()
        delete this.peerConnections[targetUserId]

        this.setState({
          streams: {
            ...this.state.streams,
            [targetUserId]: undefined,
          },
        })

        // Попытка переподключения через 1 секунду
        setTimeout(() => {
          if (this.localStream && this.dialogId) {
            console.log(`Попытка переподключиться с пользователем ID ${targetUserId}`)
            this.initiateConnection(targetUserId)
          }
        }, 1000)
      }
    }

    // Добавляем локальные медиатреки в соединение
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!)
      })
    }

    // Обработка ICE-кандидатов
    pc.onicecandidate = ({ candidate }) => {
      if (candidate && this.dialogId) {
        this.sendSignalCallback({
          targetUserId,
          signal: { type: 'ice-candidate', payload: candidate },
          dialogId: this.dialogId,
        })
      }
    }

    // Обработка входящих медиатреков
    pc.ontrack = (event) => {
      if (event.streams?.[0]) {
        this.setState({
          streams: { ...this.state.streams, [targetUserId]: event.streams[0] },
        })
      }
    }

    this.peerConnections[targetUserId] = pc
    return pc
  }

  // Инициация нового соединения (создание оффера)
  async initiateConnection(targetUserId: string) {
    if (!this.localStream || !this.dialogId) return

    try {
      this.setState({ isConnecting: true })
      const pc = this.setupPeerConnection(targetUserId)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      // Отправляем оффер целевому пользователю
      this.sendSignalCallback({
        targetUserId,
        signal: { type: 'offer', payload: offer },
        dialogId: this.dialogId,
      })
    } catch (e) {
      console.warn('Non-critical error in initiateConnection:', e)
    } finally {
      this.setState({ isConnecting: false })
    }
  }

  // Обработка входящих сигнальных сообщений
  async handleSignal(senderId: string, signal: any) {
    if (!this.dialogId) return

    try {
      switch (signal.type) {
        case 'offer': {
          // Обработка входящего оффера
          const pc = this.setupPeerConnection(senderId)
          await pc.setRemoteDescription(signal.payload)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)

          // Отправляем ответ
          this.sendSignalCallback({
            targetUserId: senderId,
            signal: { type: 'answer', payload: answer },
            dialogId: this.dialogId,
          })
          break
        }
        case 'answer': {
          // Обработка входящего ответа
          const pc = this.peerConnections[senderId]
          if (pc) await pc.setRemoteDescription(signal.payload)
          break
        }
        case 'ice-candidate': {
          // Добавление ICE-кандидата
          const pc = this.peerConnections[senderId]
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(signal.payload)
          }
          break
        }
        default: {
          console.warn('Неизвестный тип сигнала:', signal.type)
          break
        }
      }
    } catch (e) {
      console.warn('Non-critical error handling signal:', e)
    }
  }

  // Обновление списка участников: подключение новых и отключение ушедших
  updateParticipants(participants: string[]) {
    if (!this.localStream || !this.dialogId) return

    // Подключаем новых участников
    participants.forEach((participantId) => {
      if (participantId !== this.currentUserId) {
        const pc = this.peerConnections[participantId]
        if (!pc || !['connected', 'connecting'].includes(pc.connectionState)) {
          this.initiateConnection(participantId)
        }
      }
    })

    // Отключаем ушедших участников
    Object.keys(this.peerConnections).forEach((participantId) => {
      if (!participants.includes(participantId)) {
        console.log(`Участник с ID ${participantId} вышел`)
        if (this.peerConnections[participantId]) {
          this.peerConnections[participantId].close()
          delete this.peerConnections[participantId]
        }

        const newStreams = { ...this.state.streams }
        delete newStreams[participantId]

        const newStatus = { ...this.state.connectionStatus }
        delete newStatus[participantId]

        this.setState({
          streams: newStreams,
          connectionStatus: newStatus,
        })
      }
    })
  }

  // Принудительное обновление соединения с конкретным участником
  async refreshConnection(targetUserId: string) {
    console.log(`Принудительное переподключение с пользователем с ID ${targetUserId}`)

    if (this.peerConnections[targetUserId]) {
      this.peerConnections[targetUserId].close()
      delete this.peerConnections[targetUserId]

      this.setState({
        streams: {
          ...this.state.streams,
          [targetUserId]: undefined,
        },
        connectionStatus: {
          ...this.state.connectionStatus,
          [targetUserId]: 'disconnected',
        },
      })
    }

    if (this.localStream && this.dialogId) {
      await this.initiateConnection(targetUserId)
    }
  }

  // Подписка на изменения состояния
  subscribe(listener: WebRTCStateListener) {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  // Очистка всех соединений и состояния
  destroy() {
    Object.values(this.peerConnections).forEach((pc) => pc.close())
    this.peerConnections = {}
    this.setState({
      streams: {},
      isConnecting: false,
      connectionStatus: {},
    })
    this.listeners.clear()
  }

  // Получение текущего состояния
  getState() {
    return this.state
  }
}
