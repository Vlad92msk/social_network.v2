// Базовый класс для общей функциональности WebRTC
import { SignalParams, WebRTCConfig } from '../types'

export abstract class BaseWebRTCService {
  protected config: WebRTCConfig

  protected localStream?: MediaStream

  constructor(
    config: WebRTCConfig,
    protected sendSignal: (params: SignalParams) => void,
  ) {
    this.config = config
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
