import { useMediaStream } from '@ui/components/media-stream/context/MediaStreamContext'

export function MediaControls() {
  const {
    isVideoEnabled, isAudioEnabled,
    toggleVideo,
    toggleAudio,
  } = useMediaStream()

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={toggleVideo}
        className="MediaButton"
      >
        {isVideoEnabled ? 'Выключить видео' : 'Включить видео'}
      </button>
      <button
        onClick={toggleAudio}
        className="MediaButton"
      >
        {isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
      </button>
    </div>
  )
}
