import { classNames } from '@utils'

import { cn } from './cn'

interface ModalCloseButtonProps {
  onClick: VoidFunction
  className?: string
}

export function ModalCloseButton(props: ModalCloseButtonProps) {
  const { onClick, className } = props

  return <button className={classNames(cn('ButtonClose'), className)}>&times;</button>
}
