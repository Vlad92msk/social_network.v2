import { classNames, makeCn } from '@utils'

import style from './Spinner.module.scss'

export interface SpinnerBaseProps {
  className?: string
}

const cn = makeCn('Page', style)

export function SpinnerBase(props: SpinnerBaseProps) {
  const { className } = props

  return <span className={classNames(cn(), className)}>....spinner....</span>
}
