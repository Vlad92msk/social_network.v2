import { classNames, makeCn } from '@utils'
import { SpinnerBase, SpinnerBaseProps } from '../../base/SpinnerBase'

import style from './Spinner.module.scss'

interface SpinnerProps extends SpinnerBaseProps {
}

const cn = makeCn('Page', style)

export function Spinner(props: SpinnerProps) {
  const { className, ...rest } = props

  return <SpinnerBase className={classNames(cn(), className)} {...rest} />
}
