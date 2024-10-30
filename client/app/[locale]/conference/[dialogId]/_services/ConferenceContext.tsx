'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useMediaStreamContext } from '@ui/components/media-stream/MediaStream'
import { ConferenceSliceActions } from '../_store/conference.slice'
import { ConferenceSelectors } from '../_store/selectors'

type ConnectionState = RTCPeerConnectionState

interface WebRTCContextValue {
  connections: Map<string, RTCPeerConnection>
  streams: Map<string, MediaStream>
  connectionStates: Map<string, ConnectionState>
  initiateConnection: (targetUserId: string) => Promise<void>
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
]

const WebRTCContext = createContext<WebRTCContextValue | null>(null)

const serializeIceCandidate = (candidate: RTCIceCandidate): RTCIceCandidateInit => ({
  candidate: candidate.candidate,
  sdpMid: candidate.sdpMid,
  sdpMLineIndex: candidate.sdpMLineIndex,
  usernameFragment: candidate.usernameFragment,
})

export function WebRTCProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch()
  const { stream: localStream } = useMediaStreamContext()
  const participants = useSelector(ConferenceSelectors.selectUsers)
  const signals = useSelector(ConferenceSelectors.selectUserSignals)

  const [connections, setConnections] = useState<Map<string, RTCPeerConnection>>(new Map())
  const [streams, setStreams] = useState<Map<string, MediaStream>>(new Map())
  const [connectionStates, setConnectionStates] = useState<Map<string, ConnectionState>>(new Map())
  const [processedSignals] = useState<Set<string>>(new Set())

  const updateConnectionState = useCallback((userId: string, state: ConnectionState) => {
    setConnectionStates((prev) => new Map(prev).set(userId, state))
  }, [])

  const handleTrack = useCallback((userId: string, event: RTCTrackEvent) => {
    setStreams((prev) => {
      const stream = prev.get(userId) || new MediaStream()
      event.streams[0].getTracks().forEach((track) => stream.addTrack(track))
      return new Map(prev.set(userId, stream))
    })
  }, [])

  const cleanupConnection = useCallback((userId: string) => {
    setConnections((prev) => {
      const newConnections = new Map(prev)
      newConnections.delete(userId)
      return newConnections
    })
    setStreams((prev) => {
      const newStreams = new Map(prev)
      newStreams.delete(userId)
      return newStreams
    })
  }, [])

  const createPeerConnection = useCallback((userId: string) => {
    const connection = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    connection.ontrack = (event) => handleTrack(userId, event)

    connection.onconnectionstatechange = () => {
      updateConnectionState(userId, connection.connectionState)
      if (connection.connectionState === 'disconnected') {
        cleanupConnection(userId)
      }
    }

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        dispatch(ConferenceSliceActions.sendSignal({
          targetUserId: userId,
          signal: {
            type: 'ice-candidate',
            candidate: serializeIceCandidate(event.candidate),
          },
        }))
      }
    }

    setConnections((prev) => new Map(prev).set(userId, connection))
    return connection
  }, [dispatch, handleTrack, updateConnectionState, cleanupConnection])

  const addLocalTracks = useCallback((connection: RTCPeerConnection) => {
    if (!localStream) return
    localStream.getTracks().forEach((track) => {
      connection.addTrack(track, localStream)
    })
  }, [localStream])

  const initiateConnection = useCallback(async (targetUserId: string) => {
    try {
      let connection = connections.get(targetUserId)
      if (!connection || connection.connectionState === 'closed') {
        connection = createPeerConnection(targetUserId)
      }

      addLocalTracks(connection)

      const offer = await connection.createOffer()
      await connection.setLocalDescription(offer)

      dispatch(ConferenceSliceActions.sendSignal({
        targetUserId,
        signal: { type: 'offer', offer },
      }))
    } catch (error) {
      console.error('Failed to initiate connection:', error)
    }
  }, [connections, createPeerConnection, addLocalTracks, dispatch])

  useEffect(() => {
    Object.entries(signals).forEach(async ([key, { userId, signal }]) => {
      if (processedSignals.has(key)) return

      try {
        let connection = connections.get(userId)

        switch (signal.type) {
          case 'offer':
            connection = createPeerConnection(userId)
            addLocalTracks(connection)
            // @ts-ignore
            await connection.setRemoteDescription(new RTCSessionDescription(signal.offer))
            const answer = await connection.createAnswer()
            await connection.setLocalDescription(answer)
            dispatch(ConferenceSliceActions.sendSignal({
              targetUserId: userId,
              signal: { type: 'answer', answer },
            }))
            break

          case 'answer':
            if (connection) {
              // @ts-ignore
              await connection.setRemoteDescription(new RTCSessionDescription(signal.answer))
            }
            break

          case 'ice-candidate':
            if (connection) {
              await connection.addIceCandidate(new RTCIceCandidate(signal.candidate))
            }
            break

          default: return
        }

        processedSignals.add(key)
      } catch (error) {
        console.error('Signal processing error:', error)
      }
    })
  }, [signals, connections, createPeerConnection, addLocalTracks, processedSignals, dispatch])

  useEffect(() => {
    if (localStream && participants.length > 0) {
      participants.forEach((userId) => {
        if (!connections.has(userId)) {
          initiateConnection(userId)
        }
      })
    }
  }, [participants, localStream, connections, initiateConnection])

  const value = useMemo(() => ({
    connections,
    streams,
    connectionStates,
    initiateConnection,
  }), [connections, streams, connectionStates, initiateConnection])

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  )
}

export const useWebRTCContext = () => {
  const context = useContext(WebRTCContext)
  if (!context) {
    throw new Error('useWebRTCContext must be used within WebRTCProvider')
  }
  return context
}
