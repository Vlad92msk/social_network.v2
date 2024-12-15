import { makeCn } from '@utils/others'
import style from './LocalScreenShare.module.scss'
import { Name, Participant } from '../../elements'
import { useScreenShareStream } from '../../hooks'

export const cn = makeCn('LocalScreenShare', style)

interface LocalScreenShareProps {
  className?: string
  onClick?: VoidFunction
}

export function LocalScreenShare(props: LocalScreenShareProps) {
  const { className, onClick } = props
  const { videoProps, isVideoEnabled } = useScreenShareStream()

  if (!isVideoEnabled) return null
  return (
    <Participant onClick={onClick} className={className}>
      <video
        {...videoProps}
        className={cn(('Video'))}
      />
      <Name name="Вы (screen)" />
    </Participant>
  )
}
