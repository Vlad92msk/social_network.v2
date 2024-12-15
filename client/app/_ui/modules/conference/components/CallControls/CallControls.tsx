'use client'

import { Icon } from '@ui/common/Icon'
import { makeCn } from '@utils/others'
import style from './CallControls.module.scss'
import { useConference } from '../../context'

export const cn = makeCn('CallControls', style)

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
    <div className={cn()}>
      <button
        className={cn('Button')}
        data-active={isActiveCamera}
        onClick={toggleVideo}
      >
        <Icon name={isActiveCamera ? 'videocam-on' : 'videocam-off'} />
      </button>

      <button
        className={cn('Button')}
        data-active={isActiveMicrophone}
        onClick={toggleAudio}
      >
        <Icon name={isActiveMicrophone ? 'microphone' : 'microphone-off'} />
      </button>

      <button
        className={cn('Button')}
        data-active={isScreenShareActive}
        onClick={() => (isScreenShareActive ? stopScreenShare() : startScreenShare())}
      >
        <Icon name={isScreenShareActive ? 'screen-share-on' : 'screen-share-off'} />
      </button>

      <button
        className={cn('Button')}
        data-end-call="true"
        onClick={handleClose}
      >
        <Icon name="phone" />
      </button>
    </div>
  )
}
