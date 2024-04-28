import { Select as ChakraSelect, SelectProps as ChakraSelectProps } from '@chakra-ui/react'
import { classNames, makeCn } from '@utils/others'

import style from './SelectBase.module.scss'

const cn = makeCn('Select', style)

export interface SelectBaseProps extends Pick<
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

export function SelectBase(props: SelectBaseProps) {
  const { className, ...rest } = props
  return <ChakraSelect className={classNames(cn(), className)} {...rest} />
}
