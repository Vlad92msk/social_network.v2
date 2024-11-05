import { TypedEventEmitter } from './typed-event-emitter.service'
import { StateChangeEvent, WebRTCEvents, WebRTCEventsName, WebRTCState, WebRTCStateChangeType } from '../types'

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
      [WebRTCStateChangeType.STREAM]: {
        streams: {},
      },
      [WebRTCStateChangeType.DIALOG]: {
        currentUserId: config.currentUserId,
        dialogId: config.dialogId,
      },
      [WebRTCStateChangeType.CONNECTION]: {
        isConnecting: false,
        connectionStatus: {},
      },
      [WebRTCStateChangeType.SIGNAL]: {
        iceServers: config.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }],
      },
      [WebRTCStateChangeType.SHARING_SCREEN]: {
        localScreenStream: undefined,
        remoteScreenStreams: {},
        isSharing: false,
      },
    }
  }

  // Методы для работы с состоянием
  getState(): WebRTCState {
    return this.state
  }

  getDomainState<T extends WebRTCStateChangeType>(domain: T): WebRTCState[T] {
    return this.state[domain]
  }

  setState<T extends WebRTCStateChangeType>(
    domain: T,
    newState: Partial<WebRTCState[T]>,
  ) {
    this.state = {
      ...this.state,
      [domain]: {
        ...this.state[domain],
        ...newState,
      },
    }

    this.events.emit(WebRTCEventsName.STATE_CHANGED, {
      type: domain,
      payload: newState,
    } as StateChangeEvent)
  }

  // Методы для работы с событиями
  on<K extends keyof WebRTCEvents>(event: K, handler: (data: WebRTCEvents[K]) => void) {
    return this.events.on(event, handler)
  }

  emit<K extends keyof WebRTCEvents>(event: K, data: WebRTCEvents[K]) {
    this.events.emit(event, data)
  }
}
