'use client'

import styles from './examples.module.scss'
import { useConference } from '../context'
import { useCameraStream } from '../hooks/useCameraStream'

// Локальное превью с зеркальным отображением
export function LocalPreview() {
  const videoProps = useCameraStream({
    mirror: true,
    onStreamChange: (stream) => {
      // console.log('Stream changed:', stream?.getTracks())
    },
  })

  return (
    <video
      {...videoProps}
      className={`${styles.video} ${styles.videoMirrored}`}
    />
  )
}

// Простые контролы
export function CallControls() {
  const {
    media: { stream, isVideoEnabled, isAudioEnabled },
    localScreenShare,
    toggleVideo,
    toggleAudio,
    stopLocalStream,
    startScreenShare,
    stopScreenShare,
  } = useConference()

  // console.log('isVideoEnabled', isVideoEnabled)
  return (
    <div className={styles.controls}>
      <button
        className={styles.button}
        onClick={() => toggleVideo()}
        disabled={false} // Теперь кнопка всегда активна
      >
        {isVideoEnabled ? '🎥 Выкл камеру' : '📵 Вкл камеру'}
      </button>
      <button
        className={styles.button}
        onClick={toggleAudio}
        disabled={!stream} // Аудио можно переключать только при наличии потока
      >
        {isAudioEnabled ? '🎤 Выкл микрофон' : '🤫 Вкл микрофон'}
      </button>
      <button
        className={styles.button}
        onClick={stopLocalStream}
        disabled={!stream} // Отключать поток можно только если он есть
      >
        ❌ Завершить
      </button>

      <button
        className={`${styles.button} ${localScreenShare.isVideoEnabled ? styles.buttonActive : ''}`}
        onClick={() => {
          if (localScreenShare.isVideoEnabled) {
            stopScreenShare()
          } else {
            startScreenShare()
          }
        }}
      >
        {localScreenShare.isVideoEnabled ? '🎥 Остановить трансляцию' : '📺 Начать трансляцию экрана'}
      </button>
    </div>
  )
}
