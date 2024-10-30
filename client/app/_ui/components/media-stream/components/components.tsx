'use client'

import { MediaStreamProvider, useMediaStreamContext, useVideoStream } from '../MediaStream'
import { useEffect, useRef } from 'react'
import styles from './examples.module.scss'

// 1. Базовое использование - простой видеочат
export function VideoChat() {
  return (
    <MediaStreamProvider
      options={{
        video: true,
        audio: true,
        videoConstraints: {
          width: 1280,
          height: 720,
        },
      }}
      autoStart
    >
      <div className={styles.container}>
        <LocalPreview />
        <CallControls />
      </div>
    </MediaStreamProvider>
  )
}

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
    stream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
    stopStream,
  } = useMediaStreamContext();

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
        onClick={stopStream}
        disabled={!stream} // Отключать поток можно только если он есть
      >
        ❌ Завершить
      </button>
    </div>
  );
}

// 2. Продвинутое использование - множественные превью
export function AdvancedPreview() {
  return (
    <MediaStreamProvider options={{ video: true, audio: false }}>
      <div className={styles.previewsGrid}>
        <MainPreview />
        <MirrorPreview />
        <SmallPreview />
        <CanvasProcessor />
      </div>
    </MediaStreamProvider>
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
  const { stream } = useMediaStreamContext()
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

// 4. Отложенный старт
export function DelayedStart() {
  return (
    <MediaStreamProvider
      options={{ video: true, audio: true }}
      autoStart={false}
    >
      <ManualControls />
    </MediaStreamProvider>
  )
}

export function ManualControls() {
  const {
    stream,
    startStream,
    stopStream,
    error,
  } = useMediaStreamContext()

  const videoProps = useVideoStream()

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <button
          className={styles.button}
          onClick={startStream}
          disabled={!!stream}
        >
          🎬 Начать трансляцию
        </button>
        <button
          className={styles.button}
          onClick={stopStream}
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

export function AppVideoTests() {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>1. Простой видеочат</h2>
        <VideoChat />
      </section>

      {/* <section className={styles.section}> */}
      {/*   <h2 className={styles.sectionTitle}>2. Множественные превью</h2> */}
      {/*   <AdvancedPreview /> */}
      {/* </section> */}

      {/* <section className={styles.section}> */}
      {/*   <h2 className={styles.sectionTitle}>3. Отложенный старт</h2> */}
      {/*   <DelayedStart /> */}
      {/* </section> */}
    </div>
  )
}
