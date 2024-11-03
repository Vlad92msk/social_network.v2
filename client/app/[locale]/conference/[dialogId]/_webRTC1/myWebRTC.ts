// types.ts
import { EventEmitter } from 'events'
import { sendSignal } from '../_store/conferenceSocketMiddleware'
import { WebRTCError } from '../_webRTC/utils/errors'
import { WebRTCLogger } from '../_webRTC/utils/logger'

export type MediaType = 'video' | 'screen' | 'audio';
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  debug?: boolean;
}

export interface Peer {
  connection: RTCPeerConnection;
  streams: Record<MediaType, MediaStream | null>;
  status: ConnectionStatus;
}

export interface WebRTCEvents {
  'stream:added': { peerId: string; stream: MediaStream; type: MediaType };
  'stream:removed': { peerId: string; type: MediaType };
  'peer:status': { peerId: string; status: ConnectionStatus };
  'connection:error': { peerId: string; error: WebRTCError };
  'signal:error': { error: WebRTCError };
}

// PeerConnectionManager.ts
export class PeerConnectionManager {
  private peers: Map<string, Peer> = new Map()

  private config: WebRTCConfig

  constructor(config: WebRTCConfig) {
    this.config = config
  }

  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    // Получаем существующее подключение
    const existingPeer = this.peers.get(peerId)

    // Проверяем существование пира и его состояние
    if (existingPeer && existingPeer.connection && existingPeer.connection.connectionState !== 'failed') {
      console.log(`Reusing existing connection for peer ${peerId}`, {
        state: existingPeer.connection.connectionState
      })
      return existingPeer.connection
    }

    // Если есть существующий пир в неправильном состоянии, удаляем его
    if (existingPeer) {
      console.log(`Closing failed connection for peer ${peerId}`)
      existingPeer.connection.close()
      this.peers.delete(peerId)
    }

    // Создаем новое подключение
    console.log(`Creating new connection for peer ${peerId}`)
    const connection = new RTCPeerConnection({
      ...this.config,
      sdpSemantics: 'unified-plan'
    })

    // Создаем новую запись пира
    this.peers.set(peerId, {
      connection,
      streams: { video: null, screen: null, audio: null },
      status: 'connecting'
    })

    return connection
  }

  async updatePeerStream(peerId: string, stream: MediaStream | null) {
    const peer = this.peers.get(peerId)
    if (!peer) return

    const { connection } = peer
    const senders = connection.getSenders()

    if (stream) {
      for (const track of stream.getTracks()) {
        const sender = senders.find((s) => s.track?.kind === track.kind)
        if (sender) {
          await sender.replaceTrack(track)
        } else {
          connection.addTrack(track, stream)
        }
      }
    } else {
      // Если стрим null, удаляем все треки
      senders.forEach((sender) => {
        if (sender.track) {
          sender.replaceTrack(null)
        }
      })
    }
  }

  getAllPeerIds(): string[] {
    return Array.from(this.peers.keys())
  }

  getPeer(peerId: string): Peer | undefined {
    return this.peers.get(peerId)
  }

  updatePeerStatus(peerId: string, status: ConnectionStatus) {
    const peer = this.peers.get(peerId)
    if (peer) {
      peer.status = status
    }
  }

  removePeer(peerId: string) {
    const peer = this.peers.get(peerId)
    if (peer) {
      peer.connection.close()
      this.peers.delete(peerId)
    }
  }
}

// MediaStreamManager.ts
export class MediaStreamManager {
  private localStreams: Record<MediaType, MediaStream | null> = {
    video: null,
    screen: null,
    audio: null,
  }

  setLocalStream(type: MediaType, stream: MediaStream | null) {
    if (this.localStreams[type]) {
      this.localStreams[type]?.getTracks().forEach((track) => track.stop())
    }
    this.localStreams[type] = stream
  }

  getLocalStream(type: MediaType): MediaStream | null {
    return this.localStreams[type]
  }

  getAllLocalStreams(): Record<MediaType, MediaStream | null> {
    return this.localStreams
  }
}

// SignalingHandler.ts
export class SignalingHandler {
  constructor(
    private peerManager: PeerConnectionManager,
    private mediaManager: MediaStreamManager,
    private roomId: string,
  ) {}

  async handleOffer(senderId: string, offer: RTCSessionDescriptionInit) {
    try {
      console.log(`Handling offer from peer ${senderId}`)
      const connection = await this.peerManager.createPeerConnection(senderId)

      // Проверяем текущее состояние
      if (connection.signalingState !== 'stable') {
        console.log(`Connection not stable, performing rollback for peer ${senderId}`)
        await connection.setLocalDescription({ type: 'rollback' })
      }

      console.log(`Setting remote description for peer ${senderId}`)
      await connection.setRemoteDescription(new RTCSessionDescription(offer))

      console.log(`Creating answer for peer ${senderId}`)
      const answer = await connection.createAnswer()

      console.log(`Setting local description for peer ${senderId}`)
      await connection.setLocalDescription(answer)

      console.log(`Sending answer to peer ${senderId}`)
      sendSignal({
        targetUserId: senderId,
        signal: {
          type: 'answer',
          payload: answer,
        },
        dialogId: this.roomId,
      })
    } catch (error) {
      console.error(`Error handling offer from peer ${senderId}:`, error)
      throw error
    }
  }

  async handleAnswer(senderId: string, answer: RTCSessionDescriptionInit) {
    const peer = this.peerManager.getPeer(senderId)
    if (peer) {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer))
    }
  }

  async handleIceCandidate(senderId: string, candidate: RTCIceCandidateInit) {
    const peer = this.peerManager.getPeer(senderId)
    if (peer?.connection.remoteDescription) {
      await peer.connection.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }
}

// WebRTCService.ts
export class WebRTCService extends EventEmitter {
  private peerManager: PeerConnectionManager

  private mediaManager: MediaStreamManager

  private signalingHandler: SignalingHandler

  private logger: WebRTCLogger

  private roomId: string = ''

  private userId: string = ''

  constructor(config: WebRTCConfig) {
    super()
    this.peerManager = new PeerConnectionManager(config)
    this.mediaManager = new MediaStreamManager()
    this.signalingHandler = new SignalingHandler(
      this.peerManager,
      this.mediaManager,
      this.roomId,
    )
    this.logger = new WebRTCLogger(config.debug)
  }

  initialize(userId: string, roomId: string) {
    this.userId = userId
    this.roomId = roomId
    this.logger.log('Initialized', { userId, roomId })
  }

  async setLocalStream(stream: MediaStream | null) {
    try {
      this.mediaManager.setLocalStream('video', stream);

      // Update streams in all existing connections
      const peerIds = this.peerManager.getAllPeerIds();
      for (const peerId of peerIds) {
        await this.peerManager.updatePeerStream(peerId, stream);
      }

      this.logger.log('Local stream updated for all peers');
    } catch (error) {
      this.logger.error('Error setting local stream', error);
      throw WebRTCError.mediaStreamFailed('video', error);
    }
  }

  // Добавляем метод для обновления стрима для конкретного пира
  private async updatePeerStream(peerId: string) {
    const stream = this.mediaManager.getLocalStream('video');
    await this.peerManager.updatePeerStream(peerId, stream);
  }

  async initiateConnection(targetUserId: string) {
    try {
      const connection = await this.peerManager.createPeerConnection(targetUserId)
      this.setupPeerConnectionHandlers(targetUserId, connection)

      const offer = await connection.createOffer()
      await connection.setLocalDescription(offer)

      sendSignal({
        targetUserId,
        signal: {
          type: 'offer',
          payload: offer,
        },
        dialogId: this.roomId,
      })
    } catch (error) {
      this.logger.error('Failed to initiate connection', error)
      throw WebRTCError.connectionFailed(targetUserId, error)
    }
  }

  async handleSignal(senderId: string, signal: any) {
    try {
      switch (signal.type) {
        case 'offer':
          await this.signalingHandler.handleOffer(senderId, signal.payload)
          break
        case 'answer':
          await this.signalingHandler.handleAnswer(senderId, signal.payload)
          break
        case 'ice-candidate':
          await this.signalingHandler.handleIceCandidate(senderId, signal.payload)
          break
      }
    } catch (error) {
      this.logger.error('Error handling signal', error)
      this.emit('signal:error', { error: WebRTCError.connectionFailed(senderId, error) })
    }
  }

  private setupPeerConnectionHandlers(peerId: string, connection: RTCPeerConnection) {
    connection.oniceconnectionstatechange = () => {
      const state = connection.iceConnectionState
      this.logger.log(`ICE state change: ${state}`, { peerId })

      if (state === 'connected') {
        this.peerManager.updatePeerStatus(peerId, 'connected')
        this.emit('peer:status', { peerId, status: 'connected' })
      } else if (state === 'failed') {
        connection.restartIce()
      }
    }

    connection.ontrack = (event) => {
      if (event.streams?.[0]) {
        const type = event.track.kind === 'video' ? 'video' : 'audio'
        this.emit('stream:added', {
          peerId,
          stream: event.streams[0],
          type,
        })
      }
    }

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal({
          targetUserId: peerId,
          signal: {
            type: 'ice-candidate',
            payload: event.candidate,
          },
          dialogId: this.roomId,
        })
      }
    }
  }
}
