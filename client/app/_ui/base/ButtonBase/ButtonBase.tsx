import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react'
import { classNames, makeCn } from '@utils/others'

import style from './ButtonBase.module.scss'

const cn = makeCn('ButtonBase', style)

export interface ButtonBaseProps extends Pick<
  ChakraButtonProps,
  'className'
  | 'children'
  | 'spinner'
  | 'isLoading'
  | 'loadingText'
  | 'variant'
  | 'leftIcon'
  | 'rightIcon'
  | 'onClick'
  | 'disabled'
  | 'as'
> {

}

export function ButtonBase(props: ButtonBaseProps) {
  const { className, ...rest } = props
  return <ChakraButton className={classNames(cn(), className)} {...rest} />
}
