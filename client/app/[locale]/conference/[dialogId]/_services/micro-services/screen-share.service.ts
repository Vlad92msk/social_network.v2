import { SendSignalType } from '../../_store/conferenceSocketMiddleware'
import { ConnectionService } from './connection.service'
import { WebRTCStore } from './store.service'
import { WebRTCStateChangeType } from '../types'

export class ScreenSharingService {
  constructor(
    private store: WebRTCStore,
    private connectionService: ConnectionService,
    private sendSignalToServer: SendSignalType,
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

      // Обработчик остановки трансляции
      if (displayStream.getVideoTracks().length > 0) {
        displayStream.getVideoTracks()[0].onended = async () => {
          console.log('User stopped sharing screen')
          await this.notifyScreenSharingStop() // Оповещаем других участников
          await this.stopScreenSharing()
        }
      }

      // Отправляем сигнал о начале трансляции
      await this.notifyScreenSharingStart()

      this.store.setState(WebRTCStateChangeType.SHARING_SCREEN, {
        isSharing: true,
        localScreenStream: displayStream,
      })

      participants.forEach((participantId) => {
        const connection = this.connectionService.getConnection(participantId)
        if (connection && connection.connectionState === 'connected') {
          displayStream.getTracks().forEach((track) => {
            try {
              connection.addTrack(track, displayStream)
            } catch (e) {
              console.error(`Error adding track to ${participantId}:`, e)
            }
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
              try {
                connection.removeTrack(sender)
              } catch (e) {
                console.error(`Error removing track from ${participantId}:`, e)
              }
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


  // Новый метод для отправки сигнала о начале трансляции
  private async notifyScreenSharingStart() {
    const { dialogId, currentUserId } = this.store.getDomainState(WebRTCStateChangeType.DIALOG)
    if (!dialogId) return

    await this.sendSignalToServer({
      targetUserId: 'all', // Отправляем всем участникам
      signal: {
        type: 'screen-sharing-started',
        payload: {
          userId: currentUserId,
        },
      },
      dialogId,
    })
  }

  // Новый метод для отправки сигнала об остановке трансляции
  private async notifyScreenSharingStop() {
    const { dialogId, currentUserId } = this.store.getDomainState(WebRTCStateChangeType.DIALOG)
    if (!dialogId) return

    await this.sendSignalToServer({
      targetUserId: 'all',
      signal: {
        type: 'screen-sharing-stopped',
        payload: {
          userId: currentUserId,
        },
      },
      dialogId,
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
      localScreenStream.getTracks().forEach((track) => track.stop())
    }
    this.store.setState(WebRTCStateChangeType.SHARING_SCREEN, {
      isSharing: false,
      localScreenStream: undefined,
      remoteScreenStreams: {},
    })
  }
}
