import { classNames, makeCn } from '@utils/others'
import style from './LocalPreview.module.scss'
import { Name, Participant, Picture } from '../../elements'
import { useCameraStream } from '../../hooks'
import { Mic } from '../Mic'

export const cn = makeCn('LocalPreview', style)

interface LocalPreviewProps {
  className?: string
  onClick?: VoidFunction
}

export function LocalPreview(props: LocalPreviewProps) {
  const { className, onClick } = props
  const { videoProps, currentUser, showPlaceholder, localMedia } = useCameraStream()
  const isActiveMicrophone = localMedia.isAudioEnabled && !localMedia.isAudioMuted

  return (
    <Participant className={className} onClick={onClick}>
      <video
        {...videoProps}
        className={classNames(cn('Video'), cn('VideoMirrored'))}
        style={{ display: showPlaceholder ? 'none' : 'block' }}
      />
      {showPlaceholder && (
        <Picture src={currentUser?.profile_image} name={currentUser?.name} />
      )}
      <Name name="Вы" />
      <Mic userId={String(currentUser?.id)} isMicActive={isActiveMicrophone} />
    </Participant>
  )
}
