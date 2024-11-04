import { TypedEventEmitter } from './typed-event-emitter.service'
import { WebRTCEvents, WebRTCEventsName, WebRTCState, WebRTCStateChangeType } from '../types'

export class WebRTCStore {
  private state: WebRTCState

  private events = new TypedEventEmitter<WebRTCEvents>()

  constructor(
    config: {
      currentUserId: string;
      dialogId?: string;
      iceServers?: RTCIceServer[];
    },
  ) {
    this.state = {
      currentUserId: config.currentUserId,
      dialogId: config.dialogId,
      iceServers: config.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }],
      streams: {},
      isConnecting: false,
      connectionStatus: {},
    }
  }

  // Методы для работы с состоянием
  getState(): WebRTCState {
    return this.state
  }

  setState(newState: Partial<WebRTCState>, changeType: WebRTCStateChangeType) {
    this.state = { ...this.state, ...newState }
    this.events.emit(WebRTCEventsName.STATE_CHANGED, {
      type: changeType,
      payload: newState,
    })
  }

  // Методы для работы с событиями
  on<K extends keyof WebRTCEvents>(event: K, handler: (data: WebRTCEvents[K]) => void) {
    return this.events.on(event, handler)
  }

  emit<K extends keyof WebRTCEvents>(event: K, data: WebRTCEvents[K]) {
    this.events.emit(event, data)
  }
}
