import { classNames, makeCn } from '@utils/others'
import { CSSProperties, PropsWithChildren } from 'react'
import { AdaptiveVariables, createBreakPoint } from '@ui/styles/variables/media'

import styles from './CommonText.module.scss'

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

export interface CommonTextProps {
  as?: React.ElementType;
  className?: string
  style?: CSSProperties
  fs?: TextPropsFontSize
  letterSpacing?: number | string
  weight?: TextPropsFontWeight
  uppercase?: boolean
  nowrap?: boolean
  textAlign?: CSSProperties['textAlign']
}

const cn = makeCn('CommonText', styles)

export function CommonText(props: PropsWithChildren<CommonTextProps>) {
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
