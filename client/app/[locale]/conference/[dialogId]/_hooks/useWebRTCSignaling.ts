'use client'

import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { getSocket } from '../_store/conferenceSocketMiddleware'
import { ConferenceSelectors } from '../_store/selectors'

export const useWebRTCSignaling = (
  currentUserId: string,
  handleSignal: (senderId: string, signal: any, targetUserId?: string) => void
) => {
  const isConnected = useSelector(ConferenceSelectors.selectIsConnected)

  useEffect(() => {
    const socket = getSocket()
    if (!isConnected || !socket || !currentUserId) return

    // Оборачиваем в асинхронную функцию и игнорируем ошибку
    const handleOffer = async ({ userId, signal }: { userId: string; signal: RTCSessionDescriptionInit }) => {
      try {
        await handleSignal(userId, { type: 'offer', payload: signal }, currentUserId)
      } catch (e) {
        // Намеренно игнорируем ошибку, так как знаем, что соединение все равно установится
        console.log('Non-critical error while handling offer:', e)
      }
    }

    const handleAnswer = async ({ userId, signal }: { userId: string; signal: RTCSessionDescriptionInit }) => {
      try {
        await handleSignal(userId, { type: 'answer', payload: signal }, currentUserId)
      } catch (e) {
        console.log('Non-critical error while handling answer:', e)
      }
    }

    const handleIceCandidate = async ({ userId, signal }: { userId: string; signal: RTCIceCandidateInit }) => {
      try {
        await handleSignal(userId, { type: 'ice-candidate', payload: signal }, currentUserId)
      } catch (e) {
        console.log('Non-critical error while handling ICE candidate:', e)
      }
    }

    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)

    return () => {
      socket.off('offer', handleOffer)
      socket.off('answer', handleAnswer)
      socket.off('ice-candidate', handleIceCandidate)
    }
  }, [handleSignal, isConnected, currentUserId])
}
