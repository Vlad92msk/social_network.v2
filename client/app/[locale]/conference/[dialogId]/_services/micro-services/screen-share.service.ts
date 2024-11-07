import { ConnectionService } from './connection.service'
import { WebRTCStore } from './store.service'
import { WebRTCStateChangeType } from '../types'

export class ScreenSharingService {
  constructor(
    private store: WebRTCStore,
    private connectionService: ConnectionService,
  ) {}

  async startScreenSharing() {
    const { currentUserId } = this.store.getDomainState(WebRTCStateChangeType.DIALOG)
    const participants = Object.keys(
      this.store.getDomainState(WebRTCStateChangeType.CONNECTION).connectionStatus,
    ).filter((id) => id !== currentUserId)

    try {
      console.log('Starting screen sharing...')
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      })

      // Добавляем обработчик закрытия окна трансляции
      displayStream.getVideoTracks()[0].onended = () => {
        console.log('User stopped sharing screen')
        this.stopScreenSharing()
      }

      this.store.setState(WebRTCStateChangeType.SHARING_SCREEN, {
        isSharing: true,
        localScreenStream: displayStream,
      })

      // Добавляем треки в существующие соединения
      participants.forEach((participantId) => {
        const connection = this.connectionService.getConnection(participantId)
        if (connection && connection.connectionState === 'connected') {
          // Добавляем трек без сложной логики
          displayStream.getTracks().forEach((track) => {
            connection.addTrack(track, displayStream)
          })
        }
      })

      return displayStream
    } catch (error) {
      console.error('Failed to start screen sharing:', error)
      this.store.setState(WebRTCStateChangeType.SHARING_SCREEN, {
        isSharing: false,
        localScreenStream: undefined,
      })
      throw error
    }
  }

  async stopScreenSharing() {
    console.log('Stopping screen sharing...')
    const { localScreenStream } = this.store.getDomainState(WebRTCStateChangeType.SHARING_SCREEN)
    const { currentUserId } = this.store.getDomainState(WebRTCStateChangeType.DIALOG)
    const participants = Object.keys(
      this.store.getDomainState(WebRTCStateChangeType.CONNECTION).connectionStatus,
    ).filter((id) => id !== currentUserId)

    if (localScreenStream) {
      for (const track of localScreenStream.getTracks()) {
        track.stop()

        for (const participantId of participants) {
          const connection = this.connectionService.getConnection(participantId)
          if (connection) {
            const sender = connection.getSenders().find((s) => s.track === track)
            if (sender) {
              console.log('Removing screen track for:', participantId)
              connection.removeTrack(sender)
            }
          }
        }
      }
    }

    this.store.setState(WebRTCStateChangeType.SHARING_SCREEN, {
      isSharing: false,
      localScreenStream: undefined,
      remoteScreenStreams: {},
    })
  }

  handleNewParticipant(participantId: string) {
    const { localScreenStream } = this.store.getDomainState(WebRTCStateChangeType.SHARING_SCREEN)
    const connection = this.connectionService.getConnection(participantId)

    if (localScreenStream && connection && connection.connectionState === 'connected') {
      localScreenStream.getTracks().forEach((track) => {
        connection.addTrack(track, localScreenStream)
      })
    }
  }

  cleanup() {
    const { localScreenStream } = this.store.getDomainState(WebRTCStateChangeType.SHARING_SCREEN)
    if (localScreenStream) {
      localScreenStream.getTracks().forEach((track) => {
        track.stop()
      })
    }
  }
}
