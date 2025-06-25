import { classNames } from '@utils'
import { cn } from './cn'

interface ModalOverlayProps {
  onClick?: VoidFunction
  className?: string
}

export function ModalOverlay(props: ModalOverlayProps) {
  const { onClick, className } = props
  return <div className={classNames(cn('Overlay'), className)} onClick={onClick} />
}
