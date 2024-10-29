import { useCallback, useEffect, useRef } from 'react'
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

  // Буфер для ICE кандидатов
  const iceCandidatesBuffer = useRef<Map<string, RTCIceCandidateInit[]>>(new Map())

  // Создание SDP сигнала
  const createSDPSignal = useCallback((description: RTCSessionDescriptionInit): WebRTCSignal => {
    if (description.type !== 'offer' && description.type !== 'answer') {
      throw new Error('Invalid SDP type')
    }
    return {
      type: description.type,
      sdp: description.sdp || '',
    }
  }, [])

  // Сериализация ICE candidate
  const serializeIceCandidate = useCallback((candidate: RTCIceCandidate) => ({
    candidate: candidate.candidate,
    sdpMid: candidate.sdpMid,
    sdpMLineIndex: candidate.sdpMLineIndex,
    usernameFragment: candidate.usernameFragment,
  }), [])

  // Десериализация ICE candidate
  const deserializeIceCandidate = useCallback((candidateInit: RTCIceCandidateInit) => new RTCIceCandidate(candidateInit), [])

  // Функция для обработки накопленных ICE кандидатов
  const processBufferedCandidates = useCallback(async (userId: string, pc: RTCPeerConnection) => {
    const candidates = iceCandidatesBuffer.current.get(userId) || []
    console.log(`Processing ${candidates.length} buffered candidates for:`, userId)

    for (const candidateInit of candidates) {
      try {
        const candidate = deserializeIceCandidate(candidateInit)
        await pc.addIceCandidate(candidate)
        console.log('Successfully added buffered candidate')
      } catch (error) {
        console.error('Error adding buffered candidate:', error)
      }
    }
    // Очищаем буфер после обработки
    iceCandidatesBuffer.current.delete(userId)
  }, [deserializeIceCandidate])

  // Отправка сигнала через Redux
  const sendSignal = useCallback((targetUserId: string, signal: WebRTCSignal) => {
    if (signal.type === 'ice-candidate') {
      dispatch({
        type: '[CONFERENCE]/SEND_SIGNAL',
        payload: {
          targetUserId,
          signal: {
            type: 'ice-candidate',
            candidate: serializeIceCandidate(signal.candidate),
          },
        },
      })
    } else {
      dispatch({
        type: '[CONFERENCE]/SEND_SIGNAL',
        payload: { targetUserId, signal },
      })
    }
  }, [dispatch, serializeIceCandidate])

  const createConnection = useCallback(async (
    userId: string,
    isInitiator: boolean = false,
  ) => {
    console.log('Creating connection:', { userId, isInitiator })

    const pc = await webRTC.webRTCService.createPeerConnection(
      userId,
      stream,
      (candidate) => {
        sendSignal(userId, {
          type: 'ice-candidate',
          candidate,
        })
      },
      (trackStream) => {
        webRTC.addStream(userId, trackStream)
        onSignal(userId, {
          type: 'stream',
          stream: trackStream,
        })
      },
    )

    webRTC.addConnection(userId, pc)

    if (isInitiator) {
      console.log('Creating and sending offer to:', userId)
      const offer = await webRTC.webRTCService.createOffer(pc)
      sendSignal(userId, createSDPSignal(offer))
    }

    return pc
  }, [stream, webRTC, sendSignal, onSignal, createSDPSignal])

  const handleSignal = useCallback(async (userId: string, signal: WebRTCSignal) => {
    console.log('Handling signal:', { from: userId, type: signal.type })

    let pc = webRTC.getConnection(userId)

    try {
      if (!pc) {
        console.log('No existing connection, creating new one for:', userId)
        pc = await createConnection(userId, false)
      }

      if (signal.type === 'ice-candidate') {
        if (!pc.remoteDescription) {
          // Если remoteDescription ещё не установлен, буферизуем кандидата
          const bufferedCandidates = iceCandidatesBuffer.current.get(userId) || []
          bufferedCandidates.push(signal.candidate)
          iceCandidatesBuffer.current.set(userId, bufferedCandidates)
          console.log('Buffered ICE candidate for:', userId)
        } else {
          // Если remoteDescription установлен, добавляем кандидата
          const candidate = deserializeIceCandidate(signal.candidate)
          await pc.addIceCandidate(candidate)
          console.log('Added ICE candidate directly')
        }
      } else if (signal.type === 'offer') {
        console.log('Received offer from:', userId)
        await pc.setRemoteDescription({
          type: 'offer',
          sdp: signal.sdp,
        })

        // Обрабатываем буферизованные ICE кандидаты после установки remoteDescription
        await processBufferedCandidates(userId, pc)

        const answer = await webRTC.webRTCService.createAnswer(pc)
        console.log('Sending answer to:', userId)
        sendSignal(userId, createSDPSignal(answer))
      } else if (signal.type === 'answer') {
        console.log('Received answer from:', userId)
        await pc.setRemoteDescription({
          type: 'answer',
          sdp: signal.sdp,
        })

        // Обрабатываем буферизованные ICE кандидаты после установки remoteDescription
        await processBufferedCandidates(userId, pc)
      }
    } catch (error) {
      console.error('Error handling signal:', error)
    }
  }, [
    webRTC,
    createConnection,
    sendSignal,
    createSDPSignal,
    deserializeIceCandidate,
    processBufferedCandidates,
  ])

  // Очистка буфера при размонтировании
  useEffect(() => () => {
    iceCandidatesBuffer.current.clear()
  }, [])

  return {
    handleSignal,
    createConnection,
  }
}
