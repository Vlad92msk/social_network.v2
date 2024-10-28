import { useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useWebRTC } from '../_context/WebRTCContext'
import { WebRTCSignal } from '../types/media'

interface UseWebRTCSignalProps {
  stream?: MediaStream;
  onSignal: (userId: string, signal: WebRTCSignal) => void;
}

export function useWebRTCSignal(props: UseWebRTCSignalProps) {
  const { stream, onSignal } = props
  const dispatch = useDispatch()
  const webRTC = useWebRTC()

  // Вспомогательная функция для отправки сигнала через Redux
  const sendSignal = useCallback((targetUserId: string, signal: WebRTCSignal) => {
    dispatch({
      type: '[CONFERENCE]/SEND_SIGNAL',
      payload: {
        targetUserId,
        signal,
      },
    })
  }, [dispatch])

  const createSDPSignal = useCallback((description: RTCSessionDescriptionInit): WebRTCSignal => {
    if (description.type !== 'offer' && description.type !== 'answer') {
      throw new Error('Invalid SDP type')
    }
    return {
      type: description.type,
      sdp: description.sdp || '',
    }
  }, [])

  const createConnection = useCallback(async (
    userId: string,
    isInitiator: boolean = false,
  ) => {
    const pc = await webRTC.webRTCService.createPeerConnection(
      userId,
      stream,
      // Отправка ICE кандидатов через Redux
      (candidate) => {
        sendSignal(userId, {
          type: 'ice-candidate',
          candidate,
        })
      },
      // Обработка входящего медиа потока
      (trackStream) => {
        webRTC.addStream(userId, trackStream)
        onSignal(userId, {
          type: 'stream',
          stream: trackStream,
        })
      },
    )

    webRTC.addConnection(userId, pc)

    // Если мы инициатор, создаем и отправляем offer
    if (isInitiator) {
      const offer = await webRTC.webRTCService.createOffer(pc)
      sendSignal(userId, createSDPSignal(offer))
    }

    return pc
  }, [stream, webRTC, sendSignal, onSignal, createSDPSignal])

  const handleSignal = useCallback(async (userId: string, signal: WebRTCSignal) => {
    let pc = webRTC.getConnection(userId)

    try {
      if (!pc) {
        pc = await createConnection(userId)
      }

      if (signal.type === 'offer' || signal.type === 'answer') {
        await pc.setRemoteDescription({
          type: signal.type,
          sdp: signal.sdp,
        })

        if (signal.type === 'offer') {
          const answer = await webRTC.webRTCService.createAnswer(pc)
          sendSignal(userId, createSDPSignal(answer))
        }
      } else if (signal.type === 'ice-candidate') {
        await pc.addIceCandidate(signal.candidate)
      }
    } catch (error) {
      console.error('Error handling signal:', error)
    }
  }, [webRTC, createConnection, sendSignal, createSDPSignal])

  return {
    handleSignal,
    createConnection,
  }
}
