export interface WebRTCState {
  streams: Record<string, MediaStream>;
  isConnecting: boolean;
  connectionStatus: Record<string, 'connecting' | 'connected' | 'disconnected'>;
}

export type WebRTCStateListener = (state: WebRTCState) => void;

export class WebRTCManager {
  private state: WebRTCState = {
    streams: {},
    isConnecting: false,
    connectionStatus: {},
  }

  private listeners: Set<WebRTCStateListener> = new Set()

  private peerConnections: Record<string, RTCPeerConnection> = {}

  private localStream?: MediaStream

  private currentUserId: string

  private dialogId?: string

  private sendSignalCallback: (params: { targetUserId: string; signal: any; dialogId: string }) => void

  constructor(
    currentUserId: string,
    sendSignalCallback: (params: { targetUserId: string; signal: any; dialogId: string }) => void,
  ) {
    this.currentUserId = currentUserId
    this.sendSignalCallback = sendSignalCallback
  }

  private setState(newState: Partial<WebRTCState>) {
    const oldState = { ...this.state }
    // Обновляем состояние как показано выше
    this.state = {
      ...this.state,
      ...newState,
      streams: {
        ...this.state.streams,
        ...(newState.streams || {}),
      },
      connectionStatus: {
        ...this.state.connectionStatus,
        ...(newState.connectionStatus || {}),
      },
    }

    console.log('WebRTCManager state update:', {
      old: oldState,
      new: this.state,
      diff: newState,
    })

    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  subscribe(listener: WebRTCStateListener) {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setLocalStream(stream: MediaStream | undefined) {
    this.localStream = stream
    // Обновляем треки во всех существующих соединениях
    if (stream) {
      Object.entries(this.peerConnections).forEach(([userId, pc]) => {
        pc.getSenders().forEach((sender) => {
          const track = stream.getTracks().find((t) => t.kind === sender.track?.kind)
          if (track) {
            console.log(`Updating ${track.kind} track for connection with ${userId}`)
            sender.replaceTrack(track)
          }
        })
      })
    }
  }

  setDialogId(dialogId: string) {
    this.dialogId = dialogId
  }


  private createPeerConnection(targetUserId: string) {
    if (this.peerConnections[targetUserId]) {
      console.log(`Reusing existing connection for ${targetUserId}`)
      return this.peerConnections[targetUserId]
    }

    console.log(`Creating new peer connection for ${targetUserId}`)
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    })

    peerConnection.oniceconnectionstatechange = () => {
      const state = peerConnection.iceConnectionState
      console.log(`ICE Connection State for ${targetUserId}:`, state)
      if (state === 'failed') {
        console.log('Attempting to restart ICE')
        peerConnection.restartIce()
      }
    }

    peerConnection.onsignalingstatechange = () => {
      console.log(`Signaling State for ${targetUserId}:`, peerConnection.signalingState)
    }

    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state changed for ${targetUserId}:`, peerConnection.connectionState)
      if (peerConnection.connectionState === 'failed') {
        console.log(`Attempting to reconnect with ${targetUserId}`)
        peerConnection.restartIce()
      }
      this.setState({
        connectionStatus: {
          ...this.state.connectionStatus,
          [targetUserId]: peerConnection.connectionState as any,
        }
      })
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        console.log(`Adding ${track.kind} track to connection with ${targetUserId}`)
        const sender = peerConnection.addTrack(track, this.localStream!)

        if (track.kind === 'video') {
          const params = sender.getParameters()
          params.encodings = [
            {
              maxBitrate: 1000000,
              maxFramerate: 30,
            }
          ]
          sender.setParameters(params).catch(console.error)
        }
      })
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.dialogId) {
        console.log(`Sending ICE candidate to ${targetUserId}`)
        this.sendSignalCallback({
          targetUserId,
          signal: {
            type: 'ice-candidate',
            payload: event.candidate,
          },
          dialogId: this.dialogId,
        })
      }
    }

    peerConnection.ontrack = (event) => {
      console.log(`Received track from ${targetUserId}:`, event.track.kind)

      if (event.streams && event.streams[0]) {
        console.log(`Setting stream for ${targetUserId}`)
        this.setState({
          streams: {
            ...this.state.streams,
            [targetUserId]: event.streams[0],
          }
        })
      }
    }

    this.peerConnections[targetUserId] = peerConnection
    return peerConnection
  }

  async initiateConnection(targetUserId: string) {
    console.log('Initiating connection with:', targetUserId)

    if (!this.localStream || !this.dialogId) {
      console.error('Missing requirements:', { hasLocalStream: !!this.localStream, dialogId: this.dialogId })
      return
    }

    try {
      this.setState({ ...this.state, isConnecting: true })
      const peerConnection = this.createPeerConnection(targetUserId)

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      console.log(`Sending offer to ${targetUserId}`)
      this.sendSignalCallback({
        targetUserId,
        signal: {
          type: 'offer',
          payload: offer,
        },
        dialogId: this.dialogId,
      })
    } catch (error) {
      console.error('Error in initiateConnection:', error)
      if (this.peerConnections[targetUserId]) {
        this.peerConnections[targetUserId].close()
        delete this.peerConnections[targetUserId]
      }
    } finally {
      this.setState({ ...this.state, isConnecting: false })
    }
  }

  async handleSignal(senderId: string, signal: any) {
    console.log(`Handling signal from ${senderId}:`, signal.type)
    const peerConnection = this.createPeerConnection(senderId)

    switch (signal.type) {
      case 'offer':
        console.log(`Processing offer from ${senderId}`)
        if (peerConnection.signalingState !== 'stable') {
          console.log('Resetting signaling state')
          await Promise.all([
            peerConnection.setLocalDescription({ type: 'rollback' }),
            peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload))
          ])
        } else {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload))
        }

        console.log('Creating answer')
        const answer = await peerConnection.createAnswer()
        console.log('Setting local description')
        await peerConnection.setLocalDescription(answer)

        console.log(`Sending answer to ${senderId}`)
        if (this.dialogId) {
          this.sendSignalCallback({
            targetUserId: senderId,
            signal: {
              type: 'answer',
              payload: answer,
            },
            dialogId: this.dialogId,
          })
        }
        break

      case 'answer':
        console.log(`Processing answer from ${senderId}`)
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.payload))
        break

      case 'ice-candidate':
        console.log(`Processing ICE candidate from ${senderId}`)
        if (signal.payload.candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal.payload))
        }
        break
    }
  }

  updateParticipants(participants: string[]) {
    // Инициируем соединения с новыми участниками
    if (this.localStream && this.dialogId) {
      participants.forEach((participantId) => {
        if (participantId !== this.currentUserId && !this.peerConnections[participantId]) {
          console.log(`Initiating connection with new participant: ${participantId}`)
          this.initiateConnection(participantId)
        }
      })
    }

    // Очищаем соединения с отключившимися участниками
    Object.keys(this.peerConnections).forEach((participantId) => {
      if (!participants.includes(participantId)) {
        console.log(`Cleaning up connection with ${participantId}`)
        this.peerConnections[participantId]?.close()
        delete this.peerConnections[participantId]

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

  getState(): WebRTCState {
    return this.state
  }
}
