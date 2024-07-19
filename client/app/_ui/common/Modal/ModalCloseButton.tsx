import { classNames } from '@utils/others'
import { cn } from './cn'

interface ModalCloseButtonProps {
  onClick: VoidFunction
  className?: string
}

export function ModalCloseButton(props : ModalCloseButtonProps) {
  const { onClick, className } = props

  return (
    <button className={classNames(cn('ButtonClose'), className)} onClick={onClick} aria-label="Close modal">
      &times;
    </button>
  )
}