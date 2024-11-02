'use client'

import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getSocket } from '../_store/conferenceSocketMiddleware'
import { ConferenceSelectors } from '../_store/selectors'

export const useWebRTCSignaling = (currentUserId, handleSignal: (senderId: string, signal: any, targetUserId: string) => void) => {
  const isConnected = useSelector(ConferenceSelectors.selectIsConnected)

  useEffect(() => {
    const socket = getSocket()

    if (!isConnected || !socket || !currentUserId) {
      console.log('Waiting for connection...', {
        isConnected,
        hasSocket: !!socket,
        currentUserId,
        socketId: socket?.id
      })
      return
    }

    console.log('Setting up WebRTC signal handlers for user:', currentUserId)

    const handleOffer = (data: { userId: string; signal: RTCSessionDescriptionInit }) => {
      console.group('Received Offer')
      console.log('From userId:', data.userId)
      console.log('Current userId:', currentUserId)
      console.log('Signal:', data.signal)
      console.groupEnd()

      handleSignal(
        data.userId,
        {
          type: 'offer',
          payload: data.signal,
        },
        currentUserId,
      )
    }

    const handleAnswer = (data: { userId: string; signal: RTCSessionDescriptionInit }) => {
      console.group('Received Answer')
      console.log('From userId:', data.userId)
      console.log('Current userId:', currentUserId)
      console.log('Signal:', data.signal)
      console.groupEnd()

      handleSignal(
        data.userId,
        {
          type: 'answer',
          payload: data.signal,
        },
        currentUserId,
      )
    }

    const handleIceCandidate = (data: { userId: string; signal: RTCIceCandidateInit }) => {
      console.group('Received ICE Candidate')
      console.log('From userId:', data.userId)
      console.log('Current userId:', currentUserId)
      console.log('Candidate:', data.signal)
      console.groupEnd()

      handleSignal(
        data.userId,
        {
          type: 'ice-candidate',
          payload: data.signal,
        },
        currentUserId,
      )
    }

    console.log('Subscribing to WebRTC events...')
    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)

    return () => {
      console.log('Cleaning up WebRTC signal handlers...')
      socket.off('offer', handleOffer)
      socket.off('answer', handleAnswer)
      socket.off('ice-candidate', handleIceCandidate)
    }
  }, [handleSignal, isConnected, currentUserId])
}
