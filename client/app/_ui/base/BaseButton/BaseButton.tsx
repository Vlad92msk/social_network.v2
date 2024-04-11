import { Button as ChakraButton, ButtonProps as ChakraButtonProps } from '@chakra-ui/react'
import { classNames, makeCn } from '@utils/others'

import style from './BaseButton.module.scss'

const cn = makeCn('BaseButton', style)

export interface BaseButtonProps extends Pick<
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

export function BaseButton(props: BaseButtonProps) {
  const { className, ...rest } = props
  return <ChakraButton className={classNames(cn(), className)} {...rest} />
}
