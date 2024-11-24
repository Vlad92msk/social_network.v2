'use client'

import { Icon } from '@ui/common/Icon'
import { Image } from '@ui/common/Image'
import styles from './examples.module.scss'
import { useCameraStream } from '../hooks/useCameraStream'
import { useConference } from '../web-rtc/context'

// Локальное превью с зеркальным отображением
export function LocalPreview() {
  const { videoProps, isVideoEnabled, isAudioEnabled, currentUser } = useCameraStream({
    mirror: true,
    onStreamChange: (stream) => {
      console.log('Stream changed:', stream?.getTracks())
    },
  })

  return (
    <div className={styles.participant}>
      {
        isVideoEnabled ? (
          <video
            {...videoProps}
            className={`${styles.video} ${styles.videoMirrored}`}
          />
        ) : (
          <div className={styles.profileImageContainer}>
            <Image className={styles.profileImage} src={currentUser?.profile_image || ''} alt={currentUser?.name || ''} width={125} height={50} />
          </div>
        )
      }
      {isAudioEnabled
        ? (
          <Icon
            name="microphone"
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
            }}
          />
        )
        : (
          <Icon
            name="microphone-off"
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
            }}
          />
        )}
    </div>
  )
}

// Простые контролы
export function CallControls() {
  const {
    media: { stream,
      isVideoEnabled, isAudioEnabled },
    localScreenShare,
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
        onClick={() => toggleVideo()}
      >
        {isVideoEnabled ? <Icon name="videocam-off" /> : <Icon name="videocam-on" />}
      </button>
      <button
        className={styles.button}
        onClick={toggleAudio}
        style={{ backgroundColor: isAudioEnabled ? 'white' : 'transparent' }}
      >
        {isAudioEnabled ? <Icon name="microphone" /> : <Icon name="microphone-off" />}
      </button>
      {/* <button */}
      {/*   className={styles.button} */}
      {/*   onClick={stopLocalStream} */}
      {/*   disabled={!stream} // Отключать поток можно только если он есть */}
      {/* > */}
      {/*   ❌ Завершить */}
      {/* </button> */}

      <button
        style={{ backgroundColor: localScreenShare.isVideoEnabled ? 'white' : 'transparent' }}
        className={`${styles.button} ${localScreenShare.isVideoEnabled ? styles.buttonActive : ''}`}
        onClick={() => {
          if (localScreenShare.isVideoEnabled) {
            stopScreenShare()
          } else {
            startScreenShare()
          }
        }}
      >
        {localScreenShare.isVideoEnabled ? <Icon name="screen-share-on" /> : <Icon name="screen-share-off" />}
      </button>
    </div>
  )
}
