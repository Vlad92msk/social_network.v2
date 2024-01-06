import { CSSProperties, PropsWithChildren } from 'react'
import { classNames, makeCn } from '@shared/utils'
import { AdaptiveVariables, createBreakPoint } from '@ui/styles/variables/media'

import styles from './TextC.module.scss'

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

export type TextPropsFS = AdaptiveVariables<TextSizes>
export type TextPropsFontWeight = AdaptiveVariables<'bold' | 'medium' | 'light'>

export interface TextProps {
  as?: React.ElementType;
  className?: string
  style?: CSSProperties
  fs?: TextPropsFS
  letterSpacing?: number | string
  weight?: TextPropsFontWeight
  uppercase?: boolean
  nowrap?: boolean
  textAlign?: CSSProperties['textAlign']
}

const cn = makeCn('TextC', styles)

export function TextC(props: PropsWithChildren<TextProps>) {
  const {
    className, fs, letterSpacing, uppercase, nowrap, textAlign, weight, style, as: As = 'span', children,
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
          ...createBreakPoint('font-size', fs),
          ...createBreakPoint('font-weight', weight),
        }),
        className,
      )}
    >
      {children}
    </As>
  )
}
