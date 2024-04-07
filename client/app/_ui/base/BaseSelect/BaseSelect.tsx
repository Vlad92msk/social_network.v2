import { Select as ChakraSelect, SelectProps as ChakraSelectProps } from '@chakra-ui/react'
import { classNames, makeCn } from '@utils/others'

import style from './BaseSelect.module.scss'

const cn = makeCn('Select', style)

export interface BaseSelectProps extends Pick<
  ChakraSelectProps,
  'className'
  | 'children'
  | 'variant'
  | 'size'
  | 'placeholder'
  | 'defaultValue'
  | 'onChange'
  | 'icon'
  | 'isDisabled'
  | 'isRequired'
  | 'isReadOnly'
  | 'width'
> {

}

export function BaseSelect(props: BaseSelectProps) {
  const { className, ...rest } = props
  return <ChakraSelect className={classNames(cn(), className)} {...rest} />
}
