// Хук для инициализации и управления WebRTC менеджером
import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { getSocket, sendSignal } from '../../_store/conferenceSocketMiddleware'
import { ConferenceSelectors } from '../../_store/selectors'
import { webRTCInitialState } from '../initialState'
import { WebRTCState, WebRTCStateChangeType } from '../types'
import { webRTCManager } from '../webrtc.service'

export function useWebRTCManager(currentUserId: string, dialogId: string) {
  const isConnected = useSelector(ConferenceSelectors.selectIsConnected)
  const [state, setState] = useState<WebRTCState>(webRTCInitialState)

  // Добавляем в сервис первоначальные параметры
  useEffect(() => {
    webRTCManager.init({
      currentUserId,
      dialogId,
      iceServers: webRTCInitialState[WebRTCStateChangeType.SIGNAL].iceServers,
    }, sendSignal)

    const unsubscribe = webRTCManager.subscribe(setState)

    return () => {
      unsubscribe()
      webRTCManager.destroy()
    }
  }, [currentUserId, dialogId])

  // Добавляем в сервис объект сокет соединения
  useEffect(() => {
    if (!webRTCManager || !isConnected) return

    const socket = getSocket()
    if (!socket) return

    return webRTCManager.connectSignaling(socket)
  }, [isConnected])

  return { state, webRTCManager }
}
