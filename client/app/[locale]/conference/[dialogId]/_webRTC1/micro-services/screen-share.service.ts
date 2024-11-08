// Сервис захвата экрана
export class ScreenShareManager {
  private stream?: MediaStream

  private isEnabled: boolean = false

  async startScreenShare(): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })
      this.isEnabled = true
      return this.stream
    } catch (error) {
      throw new Error('Failed to start screen sharing')
    }
  }

  stopScreenShare() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = undefined
      this.isEnabled = false
    }
  }

  isScreenSharing(): boolean {
    return this.isEnabled
  }
}
