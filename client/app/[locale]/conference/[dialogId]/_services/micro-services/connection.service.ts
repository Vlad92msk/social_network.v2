// Менеджер peer-соединений
import { WebRTCStore } from './store.service'
import { WebRTCEventsName, WebRTCStateChangeType } from '../types'

export class ConnectionService {
  private connections: Record<string, RTCPeerConnection> = {}

  constructor(private store: WebRTCStore) {
    this.store.on(WebRTCEventsName.STATE_CHANGED, (event) => {
      if (event.type === WebRTCStateChangeType.STREAM) {
        // console.log('___event', event)
      }
      switch (event.type) {
        case WebRTCStateChangeType.STREAM:
          if ('localStream' in event.payload) {
            this.updateLocalStream(event.payload.localStream)
          }
          break

        case WebRTCStateChangeType.DIALOG:
          if ('dialogId' in event.payload) {
          }
          break

        case WebRTCStateChangeType.CONNECTION:
          // Обработка изменений состояния соединения
          break

        case WebRTCStateChangeType.SIGNAL:
          // Обработка сигнальных изменений
          break

        default:
          // Добавляем default case для ESLint
          break
      }
    })
  }

  createConnection(targetUserId: string) {
    const { localStream, streams } = this.store.getDomainState(WebRTCStateChangeType.STREAM)
    const { iceServers } = this.store.getDomainState(WebRTCStateChangeType.SIGNAL)
    const { connectionStatus } = this.store.getDomainState(WebRTCStateChangeType.CONNECTION)

    const pc = new RTCPeerConnection({
      iceServers,
      iceTransportPolicy: 'all',
      iceCandidatePoolSize: 10,
    })

    pc.onconnectionstatechange = () => {
      console.log('Connection state change:', targetUserId, pc.connectionState);
      this.store.setState(
        WebRTCStateChangeType.CONNECTION,
        {
          connectionStatus: {
            ...connectionStatus,
            [targetUserId]: pc.connectionState,
          },
        },
      )
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream)
      })
    }

    pc.ontrack = (event) => {
      console.log('Track received:', {
        kind: event.track.kind,
        id: event.track.id,
        streamId: event.streams?.[0]?.id
      });

      if (!event.streams?.[0]) return;

      const stream = event.streams[0];
      const existingVideoTracks = pc.getReceivers()
        .filter(receiver => receiver.track.kind === 'video')
        .length;

      if (existingVideoTracks > 1 && event.track.kind === 'video') {
        // Это screen sharing
        console.log('Adding screen sharing stream from:', targetUserId);
        this.store.setState(WebRTCStateChangeType.SHARING_SCREEN, {
          remoteScreenStreams: {
            ...this.store.getDomainState(WebRTCStateChangeType.SHARING_SCREEN).remoteScreenStreams,
            [targetUserId]: stream
          }
        });
      } else {
        // Это обычный стрим
        console.log('Adding regular stream from:', targetUserId);
        this.store.setState(WebRTCStateChangeType.STREAM, {
          streams: {
            ...this.store.getDomainState(WebRTCStateChangeType.STREAM).streams,
            [targetUserId]: stream
          }
        });
      }
    }

    pc.onnegotiationneeded = async () => {
      // Убираем логику создания offer отсюда,
      // просто сообщаем о необходимости переговоров
      console.log('Negotiation needed for:', targetUserId);
      this.store.emit(WebRTCEventsName.NEGOTIATION_NEEDED, {
        targetUserId,
        connection: pc
      });
    }

    this.connections[targetUserId] = pc
    this.store.emit(WebRTCEventsName.CONNECTION_CREATED, { userId: targetUserId, connection: pc })
    return pc
  }

  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.connections[userId]
  }

  closeConnection(userId: string) {
    const connection = this.connections[userId]
    if (connection) {
      connection.close()
      delete this.connections[userId]

      const { connectionStatus } = this.store.getDomainState(WebRTCStateChangeType.CONNECTION)
      const { streams } = this.store.getDomainState(WebRTCStateChangeType.STREAM)
      const newStreams = { ...streams }
      const newStatus = { ...connectionStatus }
      delete newStreams[userId]
      delete newStatus[userId]

      this.store.setState(WebRTCStateChangeType.CONNECTION, { connectionStatus: newStatus })
      this.store.setState(WebRTCStateChangeType.STREAM, { streams: newStreams })
    }
  }

  private updateLocalStream(stream?: MediaStream) {
    Object.entries(this.connections).forEach(([_, connection]) => {
      connection.getSenders().forEach((sender) => {
        const track = stream?.getTracks().find((t) => t.kind === sender.track?.kind)
        if (track) sender.replaceTrack(track)
      })
    })
  }
}
