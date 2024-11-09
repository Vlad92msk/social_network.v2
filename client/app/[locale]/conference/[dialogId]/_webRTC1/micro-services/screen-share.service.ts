// Сервис захвата экрана
import { EventEmitter } from 'events'

export class ScreenShareManager extends EventEmitter {
  private stream?: MediaStream

  private isEnabled: boolean = false


  async startScreenShare() {
    try {
      this.stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      })

      // Подписываемся на события остановки трансляции
      this.stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          // Вызываем stopScreenShare при остановке трансляции через браузер
          this.stopScreenShare()
        })
      })

      this.isEnabled = true
      this.emit('streamStarted', this.stream)
    } catch (error) {
      throw new Error('Ошибка начала трансляции экрана')
    }
  }

  stopScreenShare() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop())
      this.stream = undefined
      this.isEnabled = false
      this.emit('streamStopped', this.stream)
    }
  }

  isScreenSharing() {
    return this.isEnabled
  }

  getState() {
    return {
      stream: this.stream,
      isVideoEnabled: this.isEnabled,
    }
  }

  destroy() {
    this.stream = undefined
    this.isEnabled = false
    this.removeAllListeners()
  }
}
