import { BaseButton, BaseButtonProps } from '@ui/base/BaseButton'
import { classNames, makeCn } from '@utils/others'
import style from './CommonButton.module.scss'

const cn = makeCn('CommonButton', style)

interface CommonButtonProps extends BaseButtonProps {
  size?: 'xl'|
  'lg'|
  'lm'|
  'md'|
  'sm'|
  'xs'|
  'es'
}

export function CommonButton(props: CommonButtonProps) {
  const { children, className, ...rest } = props
  return <BaseButton className={classNames(cn(), className)} {...rest}>{children}</BaseButton>
}
