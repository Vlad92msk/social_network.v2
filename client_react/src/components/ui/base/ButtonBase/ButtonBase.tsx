import { classNames, makeCn } from '@utils/makeCn.ts'
import { ButtonHTMLAttributes, ReactNode } from 'react'

import style from './ButtonBase.module.scss'

const cn = makeCn('ButtonBase', style)

export interface ButtonBaseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: ReactNode
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  spinner?: ReactNode
}

export function ButtonBase(props: ButtonBaseProps) {
  const {
    className,
    children,
    isLoading,
    loadingText,
    leftIcon,
    rightIcon,
    spinner,
    disabled,
    ...rest
  } = props

  return (
    <button
      className={classNames(cn({ isLoading }), className)}
      disabled={disabled || isLoading}
      {...rest}
    >
      {leftIcon}
      {(isLoading && spinner) ? spinner : (
        isLoading ? loadingText : children
      )}
      {rightIcon}
    </button>
  )
}
