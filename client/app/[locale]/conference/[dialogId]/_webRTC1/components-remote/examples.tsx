// Пример использования в видеоконференции
import { useState } from 'react'
import styles from './examples.module.scss'
import { RemoteVideo } from './remoteVideo'
import { useRemoteVideoStream } from '../hooks/useRemoteVideoStream'

// export function VideoConference() {
//   // Пример получения удаленных потоков
//   const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
//
//   return (
//     <div className={styles.conference}>
//       {/* Локальное видео */}
//       <LocalVideo />
//
//       {/* Сетка удаленных видео */}
//       <div className={styles.remoteVideos}>
//         {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
//           <RemoteParticipant
//             key={peerId}
//             peerId={peerId}
//             stream={stream}
//           />
//         ))}
//       </div>
//     </div>
//   )
// }

// Компонент для отображения удаленного участника
export function RemoteParticipant({ peerId, stream }: { peerId: string; stream: MediaStream }) {
  // Вариант 1: Использование хука напрямую
  const videoProps = useRemoteVideoStream({
    stream,
    mirror: false,
    muted: true,
    onStreamChange: (stream) => {
      console.log(`Participant ${peerId} stream changed:`, stream)
    },
  })

  return (
    <div className={styles.participant}>
      <video {...videoProps} className={styles.video} />
      <div className={styles.participantInfo}>
        Участник
        {' '}
        {peerId}
      </div>
    </div>
  )
}

// Вариант 2: Использование готового компонента
export function SimpleRemoteParticipant({ peerId, stream }: { peerId: string; stream: MediaStream }) {
  return (
    <div className={styles.participant}>
      <RemoteVideo
        stream={stream}
        mirror={false}
        muted
        className={styles.video}
        onStreamChange={(stream) => {
          console.log(`Participant ${peerId} stream changed:`, stream)
        }}
      />
      <div className={styles.participantInfo}>
        Участник
        {' '}
        {peerId}
      </div>
    </div>
  )
}

// Пример с расширенными настройками
export function AdvancedRemoteVideo({ stream }: { stream?: MediaStream }) {
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)

  const videoProps = useRemoteVideoStream({
    stream,
    mirror: false,
    muted: isMuted,
    volume,
    onStreamChange: (stream) => {
      if (stream) {
        // Например, анализируем параметры потока
        const videoTrack = stream.getVideoTracks()[0]
        console.log('Video settings:', videoTrack.getSettings())
      }
    },
  })

  return (
    <div className={styles.videoContainer}>
      <video {...videoProps} className={styles.video} />
      <div className={styles.controls}>
        <button onClick={() => setIsMuted(!isMuted)}>
          {isMuted ? '🔇' : '🔊'}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
        />
      </div>
    </div>
  )
}
