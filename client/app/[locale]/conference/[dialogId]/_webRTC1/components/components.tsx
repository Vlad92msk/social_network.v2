'use client'

import { useEffect, useRef } from 'react'
import { useConference } from '../context'
import { useVideoStream } from '../hooks/useVideoStream'
import styles from './examples.module.scss'

// Локальное превью с зеркальным отображением
export function LocalPreview() {
  const videoProps = useVideoStream({
    mirror: true,
    onStreamChange: (stream) => {
      console.log('Stream changed:', stream?.getTracks())
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
    toggleVideo,
    toggleAudio,
    stopLocalStream,
  } = useConference()

  console.log('isVideoEnabled', isVideoEnabled)
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
    </div>
  )
}

// Основное превью без зеркала
export function MainPreview() {
  const videoProps = useVideoStream({ mirror: false })

  return (
    <div className={styles.videoContainer}>
      <h3 className={styles.title}>Основное видео</h3>
      <video {...videoProps} className={styles.video} />
    </div>
  )
}

// Зеркальное превью
export function MirrorPreview() {
  const videoProps = useVideoStream({ mirror: true })

  return (
    <div className={styles.videoContainer}>
      <h3 className={styles.title}>Зеркальное видео</h3>
      <video {...videoProps} className={`${styles.video} ${styles.videoMirrored}`} />
    </div>
  )
}

// Маленькое превью
export function SmallPreview() {
  const videoProps = useVideoStream()

  return (
    <div className={styles.videoContainer}>
      <h3 className={styles.title}>Маленькое превью</h3>
      <video {...videoProps} className={styles.smallVideo} />
    </div>
  )
}

// 3. Обработка видео через Canvas
export function CanvasProcessor() {
  const { media: { stream } } = useConference()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current

    if (!canvas || !video || !stream) return

    video.srcObject = stream
    const ctx = canvas.getContext('2d')

    const processFrame = () => {
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const { data } = imageData

        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i]
          data[i + 1] = 255 - data[i + 1]
          data[i + 2] = 255 - data[i + 2]
        }

        ctx.putImageData(imageData, 0, 0)
      }
      requestAnimationFrame(processFrame)
    }

    video.onplay = () => {
      processFrame()
    }
  }, [stream])

  return (
    <div className={styles.videoContainer}>
      <h3 className={styles.title}>Обработанное видео</h3>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ display: 'none' }}
      />
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className={styles.canvas}
      />
    </div>
  )
}

export function ManualControls() {
  const {
    media: { stream, isVideoEnabled, isAudioEnabled, error },
    stopLocalStream,
    startLocalStream,
  } = useConference()

  const videoProps = useVideoStream()

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button
          className={styles.button}
          onClick={startLocalStream}
          disabled={!!stream}
        >
          🎬 Начать трансляцию
        </button>
        <button
          className={styles.button}
          onClick={stopLocalStream}
          disabled={!stream}
        >
          ⏹ Остановить
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          Ошибка:
          {' '}
          {error.message}
        </div>
      )}

      {stream && <video {...videoProps} className={styles.video} />}
    </div>
  )
}
