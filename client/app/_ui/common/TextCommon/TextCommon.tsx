import { CSSProperties, PropsWithChildren } from 'react'
import { AdaptiveVariables, createBreakPoint } from '@ui/styles/variables/media'
import { classNames, makeCn } from '@utils/others'

import styles from './TextCommon.module.scss'

export type TextSizes =
  | '80'
  | '54'
  | '44'
  | '38'
  | '34'
  | '30'
  | '28'
  | '25'
  | '22'
  | '20'
  | '18'
  | '16'
  | '14'
  | '12'
  | '10'
  | '8'

export type TextPropsFontSize = AdaptiveVariables<TextSizes>
export type TextPropsFontWeight = AdaptiveVariables<'bold' | 'medium' | 'light'>

export interface TextCommonProps {
  as?: React.ElementType;
  className?: string
  style?: CSSProperties
  fs?: TextPropsFontSize
  letterSpacing?: number | string
  weight?: TextPropsFontWeight
  uppercase?: boolean
  nowrap?: boolean
  textElipsis?: boolean
  textAlign?: CSSProperties['textAlign']
}

const cn = makeCn('TextCommon', styles)

export function TextCommon(props: PropsWithChildren<TextCommonProps>) {
  const {
    className, fs, letterSpacing, uppercase, nowrap, textAlign, weight, style, textElipsis, as: As = 'span', children, ...rest
  } = props

  return (
    <As
      style={{
        ...style,
        letterSpacing: typeof letterSpacing === 'number' ? `${letterSpacing}em` : undefined,
        textTransform: uppercase ? 'uppercase' : undefined,
        whiteSpace: nowrap ? 'nowrap' : undefined,
        textAlign,
      }}
      className={classNames(
        cn({
          textElipsis,
          ...createBreakPoint('font-size', fs),
          ...createBreakPoint('font-weight', weight),
        }),
        className,
      )}
      {...rest}
    >
      {children}
    </As>
  )
}
