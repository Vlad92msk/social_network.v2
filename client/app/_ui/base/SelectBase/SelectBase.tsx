import React from 'react'
import { classNames, makeCn } from '@utils/others'

import style from './SelectBase.module.scss'

const cn = makeCn('Select', style)

export interface SelectBaseProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xs'
  icon?: React.ReactNode
  isDisabled?: boolean
  isRequired?: boolean
  isReadOnly?: boolean
  width?: string | number
  placeholder?: string
  ref?: React.Ref<any>
}

export function SelectBase(props: SelectBaseProps) {
  const {
    className,
    children,
    placeholder,
    defaultValue,
    onChange,
    icon,
    isDisabled,
    isRequired,
    isReadOnly,
    width,
    size,
    ref,
    ...rest
  } = props
  return (
    <select
      ref={ref}
      className={classNames(cn({ size, isDisabled, isReadOnly }), className)}
      style={{ width }}
      disabled={isDisabled}
      required={isRequired}
        // @ts-ignore
      readOnly={isReadOnly}
      onChange={onChange}
      defaultValue={defaultValue}
      {...rest}
    >
      {placeholder && (
      <option value="" disabled hidden>
        {placeholder}
      </option>
      )}
      {children}
    </select>
  )
}
