import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react'
import { classNames, makeCn } from '@shared/utils/makeCn'

import style from './Button.module.scss'

const cn = makeCn('Button', style)

export interface ButtonProps extends Pick<
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
  | 'size'
  | 'as'
> {

}

export function Button(props: ButtonProps) {
  const { className, ...rest } = props
  return <ChakraButton className={classNames(cn(), className)} {...rest} />
}
