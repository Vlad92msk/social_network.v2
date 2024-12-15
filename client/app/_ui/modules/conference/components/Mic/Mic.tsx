import { Icon } from '@ui/common/Icon'
import { makeCn } from '@utils/others'
import style from './Mic.module.scss'
import { useConferenceUserSpeaking } from '../../context'

export const cn = makeCn('Mic', style)

interface MicProps {
  userId: string
  isMicActive: boolean
}

export function Mic(props: MicProps) {
  const { userId, isMicActive } = props
  const isSpeaking = useConferenceUserSpeaking(userId)

  return (
    <div className={cn()}>
      <Icon
        name="microphone-off"
        className={cn('MicIcon', { hidden: isMicActive })}
      />
      <div className={cn('AudioLine', { status: (isSpeaking && isMicActive) ? 'active' : 'inactive' })}>
        <span />
        <span />
        <span />
      </div>
    </div>
  )
}
