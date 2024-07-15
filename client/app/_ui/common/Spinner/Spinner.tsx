import { SpinnerBase, SpinnerBaseProps } from '@ui/base/SpinnerBase'
import { classNames, makeCn } from '@utils/others'

import style from './Spinner.module.scss'

interface SpinnerProps extends SpinnerBaseProps {
}

const cn = makeCn('Page', style)

export function Spinner(props: SpinnerProps) {
  const { className, ...rest } = props

  return <SpinnerBase className={classNames(cn(), className)} {...rest} />
}
