// conference/middleware/webrtc.middleware.ts
import { AnyAction } from '@reduxjs/toolkit'
import { Middleware } from 'redux'
import { sendSignal } from './actions/conference-thunk.actions'
import { ConferenceSliceActions } from './conference.slice'
import { RootReducer } from '../../../../../store/root.reducer'
import { WebRTCService } from '../_services/webrtc.service'
import { SDPSignal } from '../types/media'

// Функция для конвертации RTCSessionDescriptionInit в SDPSignal
const convertToSDPSignal = (desc: RTCSessionDescriptionInit): SDPSignal => {
  if (desc.type !== 'offer' && desc.type !== 'answer') {
    throw new Error('Invalid SDP type')
  }
  return {
    type: desc.type,
    sdp: desc.sdp || '',
  }
}

let webRTCService: WebRTCService | null = null

export const webRTCMiddleware: Middleware<{}, RootReducer> = (store) => (next) => (action: AnyAction) => {
  if (!webRTCService) {
    webRTCService = new WebRTCService()
  }

  const result = next(action)

  switch (action.type) {
    case 'WEBRTC_INITIATE_CONNECTION': {
      const { userId, isInitiator } = action.payload.data
      const state = store.getState()
      const localStream = state.conference.streams.local;
      (async () => {
        try {
          const connection = await webRTCService?.createPeerConnection(
            userId,
            localStream,
            (candidate) => {
              store.dispatch(sendSignal(userId, {
                type: 'ice-candidate',
                candidate,
              }))
            },
            (stream) => {
              store.dispatch(ConferenceSliceActions.addStream({ userId, stream }))
            },
          )

          if (connection) {
            store.dispatch(ConferenceSliceActions.addConnection({ userId, connection }))

            if (isInitiator) {
              const offer = await webRTCService?.createOffer(connection)
              if (offer) {
                store.dispatch(sendSignal(userId, convertToSDPSignal(offer)))
              }
            }
          }
        } catch (error) {
          console.error('Error initiating WebRTC connection:', error)
          store.dispatch(ConferenceSliceActions.setError('Failed to initiate WebRTC connection'))
        }
      })()
      break
    }

    case 'WEBRTC_HANDLE_SIGNAL': {
      const { userId, signal } = action.payload.data
      const state = store.getState()
      const connection = state.conference.connections[userId];
      (async () => {
        try {
          if (!connection) {
            throw new Error('No connection found for user')
          }

          if (signal.type === 'offer' || signal.type === 'answer') {
            await connection.setRemoteDescription({
              type: signal.type,
              sdp: signal.sdp,
            })

            if (signal.type === 'offer') {
              const answer = await connection.createAnswer()
              await connection.setLocalDescription(answer)
              store.dispatch(sendSignal(userId, convertToSDPSignal(answer)))
            }
          } else if (signal.type === 'ice-candidate') {
            await connection.addIceCandidate(signal.candidate)
          }
        } catch (error) {
          console.error('Error handling WebRTC signal:', error)
          store.dispatch(ConferenceSliceActions.setError('Failed to handle WebRTC signal'))
        }
      })()
      break
    }

    case 'WEBRTC_CLOSE_CONNECTION': {
      const { userId } = action.payload.data
      if (webRTCService) {
        webRTCService.closePeerConnection(userId)
        store.dispatch(ConferenceSliceActions.closeConnection(userId))
      }
      break
    }
    default: return next(action)
  }

  return result
}
