import { ButtonBase, ButtonBaseProps, SpinnerBase } from '@components/ui'
import { classNames, makeCn } from '@utils'

import style from './Button.module.scss'

const cn = makeCn('Button', style)

interface ButtonCommonProps extends ButtonBaseProps {
  size?: 'xl' | 'lg' | 'lm' | 'md' | 'sm' | 'xs' | 'es'
  ref?: React.Ref<any>
}

export function Button(props: ButtonCommonProps) {
  const { children, className, loadingText = <SpinnerBase />, ...rest } = props
  return (
    <ButtonBase className={classNames(cn(), className)} loadingText={loadingText} {...rest}>
      {children}
    </ButtonBase>
  )
}
