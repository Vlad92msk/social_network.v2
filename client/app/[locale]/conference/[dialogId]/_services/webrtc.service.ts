export interface WebRTCState {
  streams: Record<string, MediaStream | undefined>;
  isConnecting: boolean;
  connectionStatus: Record<string, RTCPeerConnectionState>;
}

export type WebRTCStateListener = (state: WebRTCState) => void;

export class WebRTCManager {
  private state: WebRTCState = {
    streams: {},
    isConnecting: false,
    connectionStatus: {},
  }

  private listeners = new Set<WebRTCStateListener>()

  private peerConnections: Record<string, RTCPeerConnection> = {}

  private localStream?: MediaStream

  constructor(
    private currentUserId: string,
    private sendSignalCallback: (params: { targetUserId: string; signal: any; dialogId: string }) => void,
    private dialogId?: string,
  ) {}

  private setState(newState: Partial<WebRTCState>) {
    this.state = {
      ...this.state,
      ...newState,
      streams: { ...this.state.streams, ...(newState.streams || {}) },
      connectionStatus: { ...this.state.connectionStatus, ...(newState.connectionStatus || {}) },
    }
    this.listeners.forEach((listener) => listener(this.state))
  }

  setLocalStream(stream?: MediaStream) {
    this.localStream = stream
    Object.entries(this.peerConnections).forEach(([userId, pc]) => {
      pc.getSenders().forEach((sender) => {
        const track = stream?.getTracks().find((t) => t.kind === sender.track?.kind)
        if (track) sender.replaceTrack(track)
      })
    })
  }

  setDialogId(dialogId: string) {
    this.dialogId = dialogId
  }

  private setupPeerConnection(targetUserId: string) {
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

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    })

    pc.onconnectionstatechange = () => {
      console.log(`Connection state for ${targetUserId}:`, pc.connectionState)

      this.setState({
        connectionStatus: {
          ...this.state.connectionStatus,
          [targetUserId]: pc.connectionState,
        },
      })

      if (['failed', 'disconnected', 'closed'].includes(pc.connectionState)) {
        console.log(`Connection ${pc.connectionState} for ${targetUserId}, cleaning up`)
        pc.close()
        delete this.peerConnections[targetUserId]

        this.setState({
          streams: {
            ...this.state.streams,
            [targetUserId]: undefined,
          },
        })

        setTimeout(() => {
          if (this.localStream && this.dialogId) {
            console.log(`Attempting to reconnect with ${targetUserId}`)
            this.initiateConnection(targetUserId)
          }
        }, 1000)
      }
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream!)
      })
    }

    pc.onicecandidate = ({ candidate }) => {
      if (candidate && this.dialogId) {
        this.sendSignalCallback({
          targetUserId,
          signal: { type: 'ice-candidate', payload: candidate },
          dialogId: this.dialogId,
        })
      }
    }

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

  async initiateConnection(targetUserId: string) {
    if (!this.localStream || !this.dialogId) return

    try {
      this.setState({ isConnecting: true })
      const pc = this.setupPeerConnection(targetUserId)
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

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

  async handleSignal(senderId: string, signal: any) {
    if (!this.dialogId) return

    try {
      switch (signal.type) {
        case 'offer': {
          const pc = this.setupPeerConnection(senderId)
          await pc.setRemoteDescription(signal.payload)
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)

          this.sendSignalCallback({
            targetUserId: senderId,
            signal: { type: 'answer', payload: answer },
            dialogId: this.dialogId,
          })
          break
        }
        case 'answer': {
          const pc = this.peerConnections[senderId]
          if (pc) await pc.setRemoteDescription(signal.payload)
          break
        }
        case 'ice-candidate': {
          const pc = this.peerConnections[senderId]
          if (pc?.remoteDescription) {
            await pc.addIceCandidate(signal.payload)
          }
          break
        }
        default: {
          console.warn('Unknown signal type:', signal.type)
          break
        }
      }
    } catch (e) {
      console.warn('Non-critical error handling signal:', e)
    }
  }

  updateParticipants(participants: string[]) {
    if (!this.localStream || !this.dialogId) return

    // Добавляем новых участников
    participants.forEach((participantId) => {
      if (participantId !== this.currentUserId) {
        const pc = this.peerConnections[participantId]
        if (!pc || !['connected', 'connecting'].includes(pc.connectionState)) {
          this.initiateConnection(participantId)
        }
      }
    })

    // Очищаем отключившихся участников
    Object.keys(this.peerConnections).forEach((participantId) => {
      if (!participants.includes(participantId)) {
        console.log(`Participant ${participantId} left, cleaning up`)
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

  async refreshConnection(targetUserId: string) {
    console.log(`Forcing connection refresh for ${targetUserId}`)

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

  subscribe(listener: WebRTCStateListener) {
    this.listeners.add(listener)
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

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

  getState() {
    return this.state
  }
}
