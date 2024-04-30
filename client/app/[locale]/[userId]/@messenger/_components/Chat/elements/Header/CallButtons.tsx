import { ButtonCommon } from '@ui/common/ButtonCommon'
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
      <ButtonCommon size="sm">Видео звонок</ButtonCommon>
      <ButtonCommon size="sm">Аудио звонок</ButtonCommon>
    </div>
  )
}
