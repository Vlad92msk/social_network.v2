import { WebRTCStore } from './store.service'
import { WebRTCEventsName, WebRTCStateChangeType } from '../types'

export class ConnectionService {
  private connections: Record<string, RTCPeerConnection> = {}

  constructor(private store: WebRTCStore) {
    this.store.on(WebRTCEventsName.STATE_CHANGED, this.handleStateChange.bind(this))
  }

  private handleStateChange(event: any) {
    switch (event.type) {
      case WebRTCStateChangeType.STREAM:
        if ('localStream' in event.payload) {
          this.updateLocalStream(event.payload.localStream)
        }
        break
      case WebRTCStateChangeType.DIALOG:
      case WebRTCStateChangeType.CONNECTION:
      case WebRTCStateChangeType.SIGNAL:
        break
      default:
        break
    }
  }

  createConnection(targetUserId: string) {
    const { localStream, streams } = this.store.getDomainState(WebRTCStateChangeType.STREAM)

    // Закрываем существующее соединение, если оно есть
    const existingConnection = this.connections[targetUserId]
    if (existingConnection) {
      existingConnection.close()
    }

    const { iceServers } = this.store.getDomainState(WebRTCStateChangeType.SIGNAL)
    const pc = new RTCPeerConnection({
      iceServers,
      bundlePolicy: 'balanced',
      rtcpMuxPolicy: 'require',
      iceTransportPolicy: 'all', // Добавляем явное указание политики ICE
    })

    pc.onconnectionstatechange = () => this.updateConnectionStatus(targetUserId, pc.connectionState)
    if (localStream) this.addLocalTracksToConnection(pc, localStream)
    pc.ontrack = (event) => this.handleTrackEvent(event, targetUserId)
    pc.onnegotiationneeded = () => this.handleNegotiationNeeded(targetUserId, pc)
    pc.onsignalingstatechange = () => pc.signalingState === 'stable'

    this.connections[targetUserId] = pc
    this.store.emit(WebRTCEventsName.CONNECTION_CREATED, { userId: targetUserId, connection: pc })
    return pc
  }

  private addLocalTracksToConnection(pc: RTCPeerConnection, stream: MediaStream) {
    stream.getTracks().forEach((track) => pc.addTransceiver(track, stream))
  }

  private handleTrackEvent(event: RTCTrackEvent, targetUserId: string) {
    const stream = event.streams[0]
    if (!stream) return

    event.track.onended = () => {
      console.log('Remote track ended:', targetUserId, event.track.kind)
      if (event.track.kind === 'video') {
        const currentScreenStreams = this.store.getDomainState(
          WebRTCStateChangeType.SHARING_SCREEN,
        ).remoteScreenStreams

        // Если это был поток трансляции экрана, удаляем его
        if (currentScreenStreams[targetUserId]) {
          const updatedScreenStreams = { ...currentScreenStreams }
          delete updatedScreenStreams[targetUserId]

          this.store.setState(WebRTCStateChangeType.SHARING_SCREEN, {
            remoteScreenStreams: updatedScreenStreams,
          })
        }
      }
    }

    const currentStreams = this.store.getDomainState(WebRTCStateChangeType.STREAM).streams

    const hasExistingStream = currentStreams[targetUserId]
    const isScreenSharing = hasExistingStream && event.track.kind === 'video'

    const newStreamData = isScreenSharing
      ? { remoteScreenStreams: { [targetUserId]: stream } }
      : { streams: { ...currentStreams, [targetUserId]: stream } }

    console.clear()
    console.log('___event', event)
    console.log('targetUserId', targetUserId)
    this.store.setState(isScreenSharing ? WebRTCStateChangeType.SHARING_SCREEN : WebRTCStateChangeType.STREAM, newStreamData)
  }

  private handleNegotiationNeeded(targetUserId: string, pc: RTCPeerConnection) {
    this.store.emit(WebRTCEventsName.NEGOTIATION_NEEDED, { targetUserId, connection: pc })
  }

  private updateConnectionStatus(userId: string, status: RTCPeerConnectionState) {
    const { connectionStatus } = this.store.getDomainState(WebRTCStateChangeType.CONNECTION)
    this.store.setState(
      WebRTCStateChangeType.CONNECTION,
      {
        connectionStatus: { ...connectionStatus, [userId]: status },
      },
    )
  }

  getConnection(userId: string): RTCPeerConnection | undefined {
    return this.connections[userId]
  }

  closeConnection(userId: string) {
    const connection = this.connections[userId]
    if (connection) {
      connection.close()
      delete this.connections[userId]
      this.cleanupStateAfterClosure(userId)
    }
  }

  private cleanupStateAfterClosure(userId: string) {
    const { connectionStatus } = this.store.getDomainState(WebRTCStateChangeType.CONNECTION)
    const { streams } = this.store.getDomainState(WebRTCStateChangeType.STREAM)
    const updatedStreams = { ...streams }
    const updatedStatus = { ...connectionStatus }
    delete updatedStreams[userId]
    delete updatedStatus[userId]
    this.store.setState(WebRTCStateChangeType.CONNECTION, { connectionStatus: updatedStatus })
    this.store.setState(WebRTCStateChangeType.STREAM, { streams: updatedStreams })
  }

  private updateLocalStream(stream?: MediaStream) {
    Object.values(this.connections).forEach((connection) => {
      connection.getSenders().forEach((sender) => {
        const track = stream?.getTracks().find((t) => t.kind === sender.track?.kind)
        if (track) sender.replaceTrack(track)
      })
    })
  }
}
