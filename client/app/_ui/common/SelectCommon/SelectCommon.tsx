import { classNames, makeCn } from '@utils/others'
import { SelectBase, SelectBaseProps } from 'app/_ui/base/SelectBase'
import style from './SelectCommon.module.scss'

const cn = makeCn('SelectCommon', style)

interface SelectCommonProps extends SelectBaseProps {}

export function SelectCommon(props: SelectCommonProps) {
  const { children, className, ...rest } = props
  return <SelectBase className={classNames(cn(), className)} {...rest}>{children}</SelectBase>
}
