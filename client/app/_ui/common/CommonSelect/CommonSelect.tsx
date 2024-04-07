import { classNames, makeCn } from '@utils/others'
import { BaseSelect, BaseSelectProps } from '@ui/base/BaseSelect'
import style from './CommonSelect.module.scss'

const cn = makeCn('CommonSelect', style)

interface CommonSelectProps extends BaseSelectProps {}

export function CommonSelect(props: CommonSelectProps) {
  const { children, className, ...rest } = props
  return <BaseSelect className={classNames(cn(), className)} {...rest}>{children}</BaseSelect>
}
