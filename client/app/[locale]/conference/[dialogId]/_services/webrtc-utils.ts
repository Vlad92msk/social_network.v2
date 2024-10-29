import { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMediaStream } from '@ui/components/media-stream/context/MediaStreamContext'
import { useWebRTCContext } from './ConferenceContext'
import { ConferenceSliceActions } from '../_store/conference.slice'
import { getSocket } from '../_store/conferenceSocketMiddleware'
import { ConferenceSelectors } from '../_store/selectors'

interface WebRTCSignal {
  type: 'offer' | 'answer' | 'candidate';
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

interface PeerConnection {
  connection: RTCPeerConnection;
  stream?: MediaStream;
}

interface MediaStreamControls {
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  cleanup: () => void;
}

class WebRTCService {
  private peerConnections: Map<string, PeerConnection> = new Map()

  private pendingCandidates: Map<string, RTCIceCandidateInit[]> = new Map()

  private negotiating: Set<string> = new Set() // Отслеживаем процесс согласования для каждого пира

  private localStream: MediaStream | null = null

  private socket: any

  private dispatch: any

  private mediaControls: MediaStreamControls

  private config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  }

  constructor(
    socket: any,
    dispatch: any,
    mediaControls: MediaStreamControls,
    private updateRemoteStream: (userId: string, stream: MediaStream) => void,
    private removeRemoteStream: (userId: string) => void,
  ) {
    this.socket = socket
    this.dispatch = dispatch
    this.mediaControls = mediaControls
  }

  private updateTracksForConnection(peerConnection: RTCPeerConnection, userId: string) {
    // Удаляем старые треки
    const senders = peerConnection.getSenders()
    senders.forEach(sender => {
      peerConnection.removeTrack(sender)
    })

    // Добавляем новые треки
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log('Adding track to connection:', track.kind, track.enabled)
        peerConnection.addTrack(track, this.localStream!)
      })
    }
  }

  setLocalStream(stream: MediaStream) {
    console.log('Setting local stream with tracks:', stream.getTracks())
    this.localStream = stream

    // Обновляем все существующие соединения
    this.peerConnections.forEach((peer, userId) => {
      this.addTracksToConnection(peer.connection)
    })
  }

  private createPeerConnection(userId: string): RTCPeerConnection {
    console.log('Creating new peer connection for:', userId)

    const peerConnection = new RTCPeerConnection(this.config)

    peerConnection.onnegotiationneeded = async () => {
      try {
        if (this.negotiating.has(userId)) {
          console.log('Negotiation already in progress, skipping')
          return
        }

        this.negotiating.add(userId)
        console.log('Negotiation needed for:', userId)

        await this.initiateCall(userId)
      } catch (error) {
        console.error('Error during negotiation:', error)
      } finally {
        this.negotiating.delete(userId)
      }
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(userId, {
          type: 'candidate',
          candidate: event.candidate.toJSON(),
        })
      }
    }

    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', {
        kind: event.track.kind,
        enabled: event.track.enabled,
        id: event.track.id,
        streams: event.streams.length
      })

      const [remoteStream] = event.streams
      if (remoteStream) {
        const peer = this.peerConnections.get(userId)
        if (peer) {
          // Обновляем стрим для пира
          peer.stream = remoteStream
          this.updateRemoteStream(userId, remoteStream)

          // Добавляем обработчики событий трека
          event.track.onmute = () => {
            console.log('Track muted:', event.track.kind)
            this.updateRemoteStream(userId, remoteStream)
          }

          event.track.onunmute = () => {
            console.log('Track unmuted:', event.track.kind)
            this.updateRemoteStream(userId, remoteStream)
          }
        }
      }
    }

    // Добавляем существующие треки при создании соединения
    if (this.localStream) {
      this.addTracksToConnection(peerConnection)
    }

    this.peerConnections.set(userId, { connection: peerConnection })
    return peerConnection
  }

  private async addTracksToConnection(peerConnection: RTCPeerConnection) {
    if (!this.localStream) return

    // Удаляем существующие отправители
    const senders = peerConnection.getSenders()
    await Promise.all(senders.map(sender => peerConnection.removeTrack(sender)))

    // Добавляем треки
    this.localStream.getTracks().forEach(track => {
      console.log('Adding track:', track.kind, track.enabled)
      peerConnection.addTrack(track, this.localStream!)
    })
  }

  private async handlePeerDisconnection(userId: string) {
    const peer = this.peerConnections.get(userId)
    if (peer) {
      peer.connection.close()
      this.peerConnections.delete(userId)
      this.removeRemoteStream(userId)
      this.dispatch(ConferenceSliceActions.clearSignal({ userId }))
    }
  }

  async initiateCall(targetUserId: string) {
    try {
      console.log('Initiating call to:', targetUserId)
      let peerConnection = this.peerConnections.get(targetUserId)?.connection

      if (!peerConnection) {
        peerConnection = this.createPeerConnection(targetUserId)
      }

      if (this.negotiating.has(targetUserId)) {
        console.log('Negotiation already in progress for:', targetUserId)
        return
      }

      this.negotiating.add(targetUserId)

      try {
        // Убедимся, что треки добавлены перед созданием offer
        await this.addTracksToConnection(peerConnection)

        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)

        this.sendSignal(targetUserId, {
          type: 'offer',
          sdp: offer.sdp,
        })
      } finally {
        this.negotiating.delete(targetUserId)
      }
    } catch (error) {
      console.error('Error initiating call:', error)
      this.handlePeerDisconnection(targetUserId)
    }
  }

  async handleSignal(userId: string, signal: WebRTCSignal) {
    try {
      let peerConnection = this.peerConnections.get(userId)?.connection

      if (!peerConnection) {
        peerConnection = this.createPeerConnection(userId)
      }

      console.log('Handling signal:', {
        type: signal.type,
        userId,
        signalingState: peerConnection.signalingState,
        negotiating: this.negotiating.has(userId)
      })

      switch (signal.type) {
        case 'offer': {
          // Если мы уже ведем переговоры и получили встречное предложение,
          // сравниваем session ID, чтобы определить, кто должен принять offer
          if (this.negotiating.has(userId)) {
            const offerCollision = signal.sdp!.localeCompare(
              peerConnection.localDescription?.sdp || ''
            ) > 0

            if (offerCollision) {
              console.log('Collision detected, rolling back')
              await peerConnection.setLocalDescription({ type: 'rollback' })
            } else {
              console.log('Ignoring collided offer')
              return
            }
          }

          await peerConnection.setRemoteDescription(new RTCSessionDescription({
            type: 'offer',
            sdp: signal.sdp,
          }))

          const answer = await peerConnection.createAnswer()
          await peerConnection.setLocalDescription(answer)

          this.sendSignal(userId, {
            type: 'answer',
            sdp: answer.sdp,
          })

          // Добавляем накопленные ICE кандидаты
          const pendingCandidates = this.pendingCandidates.get(userId) || []
          await Promise.all(
            pendingCandidates.map(candidate =>
              peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            )
          )
          this.pendingCandidates.delete(userId)
          break
        }

        case 'answer': {
          if (peerConnection.signalingState === 'have-local-offer') {
            await peerConnection.setRemoteDescription(new RTCSessionDescription({
              type: 'answer',
              sdp: signal.sdp,
            }))

            // Добавляем накопленные ICE кандидаты
            const pendingCandidates = this.pendingCandidates.get(userId) || []
            await Promise.all(
              pendingCandidates.map(candidate =>
                peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
              )
            )
            this.pendingCandidates.delete(userId)
          } else {
            console.warn('Received answer in wrong state:', peerConnection.signalingState)
          }
          break
        }

        case 'candidate': {
          if (signal.candidate) {
            try {
              // Если нет remote description, сохраняем кандидата
              if (!peerConnection.remoteDescription) {
                const pendingCandidates = this.pendingCandidates.get(userId) || []
                pendingCandidates.push(signal.candidate)
                this.pendingCandidates.set(userId, pendingCandidates)
                console.log('Saved pending candidate for:', userId)
              } else {
                await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate))
              }
            } catch (error) {
              console.warn('Error adding ICE candidate:', error)
            }
          }
          break
        }
      }
    } catch (error) {
      console.error('Error handling signal:', {
        error,
        signalType: signal.type,
        userId
      })
    }
  }

  private sendSignal(targetUserId: string, signal: WebRTCSignal) {
    this.dispatch(ConferenceSliceActions.sendSignal({ targetUserId, signal }))
  }

  // Метод для обновления треков (например, при включении/выключении видео)
  async updateTracks() {
    if (!this.localStream) return

    console.log('Updating tracks for all connections')
    for (const [userId, peer] of this.peerConnections) {
      await this.addTracksToConnection(peer.connection)

      // Если соединение стабильно, инициируем новое согласование
      if (peer.connection.signalingState === 'stable') {
        const offer = await peer.connection.createOffer()
        await peer.connection.setLocalDescription(offer)

        this.sendSignal(userId, {
          type: 'offer',
          sdp: offer.sdp,
        })
      }
    }
  }

  // Метод для очистки ресурсов при выходе из конференции
  cleanup() {
    this.peerConnections.forEach((peer, userId) => {
      this.handlePeerDisconnection(userId)
    })
    this.peerConnections.clear()
    this.pendingCandidates.clear()

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }
  }
}

// React Hook для использования WebRTC сервиса
export function useWebRTC() {
  const [webRTCService, setWebRTCService] = useState<WebRTCService | null>(null)
  const socket = getSocket()
  const isConnected = useSelector(ConferenceSelectors.selectIsConnected)
  const dispatch = useDispatch()
  const {
    stream: localStream,
    toggleVideo,
    toggleAudio,
    cleanup: cleanupMediaStream,
    isVideoEnabled,
    isAudioEnabled,
  } = useMediaStream()
  const participants = useSelector(ConferenceSelectors.selectUsers)
  const {
    updateRemoteStream,
    removeRemoteStream,
    setLocalStream
  } = useWebRTCContext()

  // Синхронизируем localStream между контекстами
  useEffect(() => {
    if (localStream) {
      setLocalStream(localStream)
    }
  }, [localStream, setLocalStream])

  useEffect(() => {
    if (isConnected && !webRTCService) {
      const mediaControls: MediaStreamControls = {
        toggleVideo,
        toggleAudio,
        cleanup: cleanupMediaStream,
      }

      const service = new WebRTCService(
        socket,
        dispatch,
        mediaControls,
        updateRemoteStream,
        removeRemoteStream,
      )
      setWebRTCService(service)
    }
  }, [isConnected, socket, updateRemoteStream, removeRemoteStream, dispatch, webRTCService, toggleVideo, toggleAudio, cleanupMediaStream])

  useEffect(() => {
    if (webRTCService && localStream) {
      webRTCService.setLocalStream(localStream)
    }
  }, [webRTCService, localStream])

  // Добавляем эффект для обновления треков при изменении состояния видео/аудио
  useEffect(() => {
    if (webRTCService && localStream) {
      console.log('Updating tracks due to media state change:', { isVideoEnabled, isAudioEnabled })
      webRTCService.updateTracks().catch(error => {
        console.error('Error updating tracks:', error)
      })
    }
  }, [webRTCService, localStream, isVideoEnabled, isAudioEnabled])

  const signals = useSelector(ConferenceSelectors.selectUserSignals)

  useEffect(() => {
    if (!webRTCService) return

    Object.entries(signals).forEach(([userId, { signal }]) => {
      webRTCService.handleSignal(userId, signal)
      dispatch(ConferenceSliceActions.clearSignal({ userId }))
    })
  }, [dispatch, signals, webRTCService])

  useEffect(() => {
    if (!webRTCService) return

    participants.forEach((userId) => {
      webRTCService.initiateCall(userId)
    })
  }, [participants, webRTCService])

  return {
    toggleVideo: useCallback(async () => {
      await toggleVideo()
    }, [toggleVideo]),

    toggleAudio: useCallback(async () => {
      await toggleAudio()
    }, [toggleAudio]),

    cleanup: useCallback(() => {
      webRTCService?.cleanup()
    }, [webRTCService]),

    isVideoEnabled,
    isAudioEnabled,
  }
}
