import { classNames, makeCn } from '@utils/others'
import { SelectBase, SelectBaseProps } from 'app/_ui/base/SelectBase'
import style from './Select.module.scss'

const cn = makeCn('Select', style)

interface SelectCommonProps extends SelectBaseProps {}

export function Select(props: SelectCommonProps) {
  const { children, className, ...rest } = props
  return <SelectBase className={classNames(cn(), className)} {...rest}>{children}</SelectBase>
}
