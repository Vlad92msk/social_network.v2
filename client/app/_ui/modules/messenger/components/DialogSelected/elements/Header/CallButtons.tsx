import { classNames } from '@utils/others'
import { Icon } from 'app/_ui/common/Icon'
import { cn } from './cn'

interface CallButtonsProps {
  className?: string
}

export function CallButtons(props: CallButtonsProps) {
  const { className } = props

  return (
    <div
      className={classNames(cn('CallButtons'), className)}
    >
      <button onClick={() => console.log('video call')}>
        <Icon name="video-camera" />
      </button>
      <button onClick={() => console.log('audio call')}>
        <Icon name="phone" />
      </button>
    </div>
  )
}
