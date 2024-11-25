'use client'

import { Icon } from '@ui/common/Icon'
import styles from './examples.module.scss'
import { useConference } from '../web-rtc/context'

// Простые контролы
export function CallControls() {
  const {
    localMedia: { isVideoEnabled, isAudioEnabled },
    screenShare: { isVideoEnabled: isScreenShareActive },
    toggleVideo,
    toggleAudio,
    startScreenShare,
    stopScreenShare,
  } = useConference()

  const handleClose = () => {
    // Закрываем текущую вкладку браузера
    window.close()

    // Альтернативный вариант, если window.close() не сработает
    // (некоторые браузеры блокируют window.close() если вкладка не была открыта через JavaScript)
    // @ts-ignore
    if (!window.close()) {
      window.location.href = 'about:blank'
    }
  }

  return (
    <div className={styles.controls}>
      <button
        className={styles.button}
        onClick={handleClose}
      >
        <Icon name="phone" />
      </button>

      <button
        style={{ backgroundColor: isVideoEnabled ? 'white' : 'transparent' }}
        className={styles.button}
        onClick={toggleVideo}
      >
        <Icon name={isVideoEnabled ? 'videocam-off' : 'videocam-on'} />
      </button>

      <button
        style={{ backgroundColor: isAudioEnabled ? 'white' : 'transparent' }}
        className={styles.button}
        onClick={toggleAudio}
      >
        <Icon name={isAudioEnabled ? 'microphone' : 'microphone-off'} />
      </button>

      <button
        style={{ backgroundColor: isScreenShareActive ? 'white' : 'transparent' }}
        className={`${styles.button} ${isScreenShareActive ? styles.buttonActive : ''}`}
        onClick={() => (isScreenShareActive ? stopScreenShare() : startScreenShare())}
      >
        <Icon name={isScreenShareActive ? 'screen-share-on' : 'screen-share-off'} />
      </button>
    </div>
  )
}
