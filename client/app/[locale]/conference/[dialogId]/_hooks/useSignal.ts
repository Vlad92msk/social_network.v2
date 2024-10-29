import { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useWebRTC } from '../_context/WebRTCContext'
import { ConferenceSliceActions } from '../_store/conference.slice'
import { getSocket } from '../_store/conferenceSocketMiddleware'

// Типизация сигнала WebRTC
interface WebRTCSignal {
  type: string;
  sdp?: string;
  candidate?: RTCIceCandidateInit;
}

// Хук для работы с сигналами WebRTC
export function useWebRTCSignal(props: { localStream?: MediaStream }) {
  const { localStream } = props

  const dispatch = useDispatch()
  const socket = getSocket()

  const { addConnection, getConnection, addStream, webRTCService } = useWebRTC()

  const createConnection = useCallback(
    async (userId: string, shouldInitiate: boolean, stream?: MediaStream) => {
      // Проверяем, существует ли уже подключение с этим пользователем
      let peerConnection = getConnection(userId)

      if (!peerConnection) {
        // Создаем новое подключение, если его не было
        peerConnection = await webRTCService.createPeerConnection(
          userId,
          stream,
          (candidate) => {
            console.log('Sending ICE candidate:', candidate)
            dispatch(ConferenceSliceActions.sendSignal({ targetUserId: userId, signal: { type: 'candidate', candidate } }))
          },
          (remoteStream) => {
            console.log('Receiving remote stream:', remoteStream)
            addStream(userId, remoteStream)
          },
        )

        // Добавляем соединение в контекст
        addConnection(userId, peerConnection)

        // Если текущий пользователь инициатор, создаем offer
        if (shouldInitiate) {
          const offer = await webRTCService.createOffer(peerConnection)
          dispatch(ConferenceSliceActions.sendSignal({ targetUserId: userId, signal: offer }))
        }
      }

      return peerConnection
    },
    [getConnection, addConnection, addStream, webRTCService, dispatch],
  )

  const handleSignal = useCallback(
    async (userId: string, signal: WebRTCSignal) => {
      if (signal.type === 'offer') {
        // Создаем соединение только один раз
        const peerConnection = await createConnection(userId, false, localStream)
        console.log('Setting remote description for offer:', signal)
        // @ts-ignore
        await webRTCService.setRemoteDescription(peerConnection, signal)
        const answer = await webRTCService.createAnswer(peerConnection)
        dispatch(ConferenceSliceActions.sendSignal({ targetUserId: userId, signal: answer }))
      } else {
        // Используем существующее соединение или создаем новое
        const peerConnection = await createConnection(userId, false)

        if (signal.type === 'answer') {
          console.log('Setting remote description for answer:', signal)
          // @ts-ignore
          await peerConnection.setRemoteDescription(new RTCSessionDescription(signal))
        } else if (signal.type === 'candidate') {
          console.log('Adding ICE candidate:', signal.candidate)
          await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate))
        }
      }
    },
    [createConnection, webRTCService, dispatch, localStream],
  )

  // Эффект для обработки сигналов, которые приходят через сокет
  useEffect(() => {
    if (!socket) return

    const handleSocketSignal = ({ userId, signal }: { userId: string, signal: WebRTCSignal }) => {
      // console.log('Received signal via socket:', { userId, signalType: signal.type })
      handleSignal(userId, signal)
    }

    socket.on('signal', handleSocketSignal)

    return () => {
      socket.off('signal', handleSocketSignal)
    }
  }, [socket, handleSignal])

  // Функция для создания и отправки оффера
  const createOffer = useCallback(
    async (userId: string, stream?: MediaStream) => {
      // Указываем, что этот пользователь инициатор соединения
      const peerConnection = await createConnection(userId, true, stream)
      const offer = await webRTCService.createOffer(peerConnection)
      dispatch(ConferenceSliceActions.sendSignal({ targetUserId: userId, signal: offer }))
    },
    [createConnection, webRTCService, dispatch],
  )

  return {
    handleSignal,
    createOffer,
    createConnection,
  }
}
