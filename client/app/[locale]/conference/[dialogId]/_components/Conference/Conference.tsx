'use client'

import { useParams } from 'next/navigation'
import { makeCn } from '@utils/others'
import style from './Conference.module.scss'
import { useMediaStream } from '../../_hooks/useMediaStream'
import { MediaControls } from '../MediaControls'
import { VideoView } from '../VideoView'

const cn = makeCn('Conference', style)

export function Conference() {
  const { dialogId } = useParams<{ dialogId: string }>()
  const {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    toggleVideo,
    toggleAudio,
  } = useMediaStream()

  return (
    <div className={cn()}>
      <div className={cn('ParticipantsContainer')}>
        <div className={cn('Participant')}>
          <VideoView
            stream={stream}
            muted
            isEnabled={isVideoEnabled}
          />
        </div>
      </div>
      <div className={cn('ActionsContainer')}>
        <MediaControls
          isVideoEnabled={isVideoEnabled}
          isAudioEnabled={isAudioEnabled}
          onToggleVideo={toggleVideo}
          onToggleAudio={toggleAudio}
        />
      </div>
    </div>
  )
}
