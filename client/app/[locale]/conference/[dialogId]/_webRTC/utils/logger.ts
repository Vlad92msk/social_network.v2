export class WebRTCLogger {
  constructor(private enabled: boolean = true) {}

  log(message: string, ...args: any[]) {
    if (this.enabled) {
      console.log(`[WebRTC] ${message}`, ...args)
    }
  }

  error(message: string, ...args: any[]) {
    if (this.enabled) {
      console.error(`[WebRTC Error] ${message}`, ...args)
    }
  }
}
