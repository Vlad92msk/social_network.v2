import { IconBase } from '@ui/base/IconBase'
import { classNames } from '@utils/others'
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
        <IconBase name="video-camera" />
      </button>
      <button onClick={() => console.log('audio call')}>
        <IconBase name="phone" />
      </button>
    </div>
  )
}
