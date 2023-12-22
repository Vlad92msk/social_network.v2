import { Select as ChakraSelect, SelectProps as ChakraSelectProps } from '@chakra-ui/react'
import { classNames, makeCn } from '@shared/utils/makeCn'

import style from './Select.module.scss'

const cn = makeCn('Select', style)

export interface SelectProps extends Pick<
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

export function Select(props: SelectProps) {
  const { className, ...rest } = props
  return <ChakraSelect className={classNames(cn(), className)} {...rest} />
}
