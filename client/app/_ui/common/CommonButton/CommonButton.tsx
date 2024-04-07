import { classNames, makeCn } from '@shared/utils'
import { BaseButton, BaseButtonProps } from 'app/_ui/base/BaseButton'
import style from './CommonButton.module.scss'

const cn = makeCn('CommonButton', style)

interface CommonButtonProps extends BaseButtonProps {}

export function CommonButton(props: CommonButtonProps) {
  const { children, className, ...rest } = props
  return <BaseButton className={classNames(cn(), className)} {...rest}>{children}</BaseButton>
}
