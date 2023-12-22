import { classNames, makeCn } from '@shared/utils/makeCn'
import { Button, ButtonProps } from '@ui/base/Button'
import style from './ButtonC.module.scss'

const cn = makeCn('ButtonC', style)

export function ButtonC(props: ButtonProps) {
  const { children, className, ...rest } = props
  return <Button className={classNames(cn(), className)} {...rest}>{children}</Button>
}
