// Базовый класс для общей функциональности WebRTC
import { SendSignalType } from '../../_store/conferenceSocketMiddleware'
import { WebRTCConfig } from '../types'

export abstract class BaseWebRTCService {
  private DEFAULT_ICE_URL = 'stun:stun.l.google.com:19302'

  protected config: WebRTCConfig

  protected localStream?: MediaStream

  constructor(
    config: WebRTCConfig,
    protected sendSignal: SendSignalType,
  ) {
    this.config = {
      ...config,
      iceServers: config.iceServers || [{ urls: this.DEFAULT_ICE_URL }],
    }
  }

  getCurrentUserId(): string {
    return this.config.currentUserId
  }

  getDialogId(): string | undefined {
    return this.config.dialogId
  }

  setDialogId(dialogId: string) {
    this.config.dialogId = dialogId
  }

  setLocalStream(stream?: MediaStream) {
    this.localStream = stream
  }
}
