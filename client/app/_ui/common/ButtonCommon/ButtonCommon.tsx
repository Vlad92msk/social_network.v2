import { classNames, makeCn } from '@utils/others'
import { ButtonBase, ButtonBaseProps } from 'app/_ui/base/ButtonBase'
import style from './ButtonCommon.module.scss'

const cn = makeCn('ButtonCommon', style)

interface ButtonCommonProps extends ButtonBaseProps {
  size?: 'xl'|
  'lg'|
  'lm'|
  'md'|
  'sm'|
  'xs'|
  'es'
}

export function ButtonCommon(props: ButtonCommonProps) {
  const { children, className, ...rest } = props
  return <ButtonBase className={classNames(cn(), className)} {...rest}>{children}</ButtonBase>
}
