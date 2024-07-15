import { InputHTMLAttributes } from 'react'
import { Text, TextCommonProps } from 'app/_ui/common/Text'

import { classNames } from '@utils/others'
import { cn } from './cn'

interface InputCommonProps extends TextCommonProps, InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function Input(props: InputCommonProps) {
  const { className, ...rest } = props

  return <Text className={classNames(cn('Text'), className)} as="input" {...rest} />
}
