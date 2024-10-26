interface MediaControlsProps {
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  onToggleVideo: VoidFunction
  onToggleAudio: VoidFunction
}

export function MediaControls(props: MediaControlsProps) {
  const {
    isVideoEnabled,
    isAudioEnabled,
    onToggleVideo,
    onToggleAudio,
  } = props
  return (
    <div className="MediaControls">
      <button
        onClick={onToggleVideo}
        className="MediaButton"
      >
        {isVideoEnabled ? 'Выключить видео' : 'Включить видео'}
      </button>
      <button
        onClick={onToggleAudio}
        className="MediaButton"
      >
        {isAudioEnabled ? 'Выключить микрофон' : 'Включить микрофон'}
      </button>
    </div>
  )
}
