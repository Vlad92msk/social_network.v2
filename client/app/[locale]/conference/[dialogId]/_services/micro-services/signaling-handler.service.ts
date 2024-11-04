import { BaseWebRTCService } from './base.service'
import { SignalHandlers } from '../types'

export class SignalingHandler extends BaseWebRTCService {
  private handlers?: SignalHandlers

  setHandlers(handlers: SignalHandlers) {
    this.handlers = handlers
  }

  async handleSignal(senderId: string, signal: any) {
    if (!this.handlers || !this.getDialogId()) return

    try {
      switch (signal.type) {
        case 'offer': {
          await this.handlers.onOffer(senderId, signal.payload)
          break
        }
        case 'answer': {
          await this.handlers.onAnswer(senderId, signal.payload)
          break
        }
        case 'ice-candidate': {
          await this.handlers.onIceCandidate(senderId, signal.payload)
          break
        }
        default: {
          console.warn('Неизвестный тип сигнала:', signal.type)
          break
        }
      }
    } catch (e) {
      console.warn('Non-critical error handling signal:', e)
    }
  }

  sendOffer(targetUserId: string, offer: RTCSessionDescriptionInit) {
    const dialogId = this.getDialogId()
    if (!dialogId) return

    this.sendSignal({
      targetUserId,
      signal: { type: 'offer', payload: offer },
      dialogId,
    })
  }

  sendAnswer(targetUserId: string, answer: RTCSessionDescriptionInit) {
    const dialogId = this.getDialogId()
    if (!dialogId) return

    this.sendSignal({
      targetUserId,
      signal: { type: 'answer', payload: answer },
      dialogId,
    })
  }

  sendIceCandidate(targetUserId: string, candidate: RTCIceCandidateInit) {
    const dialogId = this.getDialogId()
    if (!dialogId) return

    this.sendSignal({
      targetUserId,
      signal: { type: 'ice-candidate', payload: candidate },
      dialogId,
    })
  }
}
