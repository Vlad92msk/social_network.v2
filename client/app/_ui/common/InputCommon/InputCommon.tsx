import { InputProps as ChakraInputProps } from '@chakra-ui/react'
import { TextCommon, TextCommonProps } from '@ui/common/TextCommon'

import { classNames } from '@utils/others'
import { cn } from './cn'

interface InputCommonProps extends TextCommonProps, Pick<ChakraInputProps, 'placeholder' | 'value' | 'onChange' | 'type' | 'onBlur'> {
// className?: string
}

export function InputCommon(props: InputCommonProps) {
  const { className, ...rest } = props

  return <TextCommon className={classNames(cn('Text'), className)} as="input" {...rest} />
}
