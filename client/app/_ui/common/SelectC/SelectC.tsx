import { classNames, makeCn } from '@shared/utils/makeCn'
import { Select, SelectProps } from '@ui/base/Select'
import style from './SelectC.module.scss'

const cn = makeCn('SelectC', style)

export function SelectC(props: SelectProps) {
  const { children, className, ...rest } = props
  return <Select className={classNames(cn(), className)} {...rest}>{children}</Select>
}
