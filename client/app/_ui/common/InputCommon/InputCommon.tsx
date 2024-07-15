import { InputHTMLAttributes } from 'react'
import { TextCommon, TextCommonProps } from '@ui/common/TextCommon'

import { classNames } from '@utils/others'
import { cn } from './cn'

interface InputCommonProps extends TextCommonProps, InputHTMLAttributes<HTMLInputElement> {
  className?: string
}

export function InputCommon(props: InputCommonProps) {
  const { className, ...rest } = props

  return <TextCommon className={classNames(cn('Text'), className)} as="input" {...rest} />
}
