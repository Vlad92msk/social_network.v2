import { classNames } from '@utils'
import { InputHTMLAttributes } from 'react'
import { Text, TextCommonProps } from '../Text'

import { cn } from './cn'

interface InputCommonProps extends TextCommonProps, InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function Input(props: InputCommonProps) {
  const { className, ...rest } = props

  return <Text className={classNames(cn('Text'), className)} as="input" {...rest} />
}
