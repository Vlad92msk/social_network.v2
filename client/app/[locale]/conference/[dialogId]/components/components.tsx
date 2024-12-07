'use client'

import { Icon } from '@ui/common/Icon'
import styles from './examples.module.scss'
import { useConference } from '../web-rtc/context'

// Простые контролы
export function CallControls() {
  const {
    localMedia: { isVideoEnabled, isAudioEnabled, isAudioMuted, isVideoMuted },
    toggleVideo,
    toggleAudio,
    screenShare: { isVideoEnabled: isScreenShareActive },
    startScreenShare,
    stopScreenShare,
  } = useConference()

  const handleClose = () => {
    window.close()

    // Альтернативный вариант, если window.close() не сработает
    // (некоторые браузеры блокируют window.close() если вкладка не была открыта через JavaScript)
    // @ts-ignore
    if (!window.close()) {
      window.location.href = 'about:blank'
    }
  }

  const isActiveMicrophone = isAudioEnabled && !isAudioMuted
  const isActiveCamera = isVideoEnabled && !isVideoMuted

  return (
    <div className={styles.controls}>
      <button
        className={styles.button}
        data-end-call="true"
        onClick={handleClose}
      >
        <Icon name="phone" />
      </button>

      <button
        className={styles.button}
        data-active={isActiveCamera}
        onClick={toggleVideo}
      >
        <Icon name={isActiveCamera ? 'videocam-off' : 'videocam-on'} />
      </button>

      <button
        className={styles.button}
        data-active={isActiveMicrophone}
        onClick={toggleAudio}
      >
        <Icon name={isActiveMicrophone ? 'microphone' : 'microphone-off'} />
      </button>

      <button
        className={styles.button}
        data-active={isScreenShareActive}
        onClick={() => (isScreenShareActive ? stopScreenShare() : startScreenShare())}
      >
        <Icon name={isScreenShareActive ? 'screen-share-on' : 'screen-share-off'} />
      </button>
    </div>
  )
}
