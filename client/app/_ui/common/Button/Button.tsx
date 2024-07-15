import { SpinnerBase } from '@ui/base/SpinnerBase'
import { classNames, makeCn } from '@utils/others'
import { ButtonBase, ButtonBaseProps } from 'app/_ui/base/ButtonBase'
import style from './Button.module.scss'

const cn = makeCn('Button', style)

interface ButtonCommonProps extends ButtonBaseProps {
  size?: 'xl'|
  'lg'|
  'lm'|
  'md'|
  'sm'|
  'xs'|
  'es'
}

export function Button(props: ButtonCommonProps) {
  const { children, className, loadingText = <SpinnerBase />, ...rest } = props
  return (
    <ButtonBase
      className={classNames(cn(), className)}
      loadingText={loadingText}
      {...rest}
    >
      {children}
    </ButtonBase>
  )
}
