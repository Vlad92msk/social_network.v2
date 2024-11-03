import { WebRTCConfig } from './types'
import { WebRTCService } from './WebRTCService'

export class WebRTCFactory {
  static createService(config: WebRTCConfig): WebRTCService {
    return new WebRTCService(config)
  }
}
