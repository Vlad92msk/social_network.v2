import { rem, classNames, makeCn, AdaptiveVariables, createBreakPoint } from '@utils'
import { flow } from 'lodash'
import { CSSProperties, PropsWithChildren } from 'react'

import styles from './Text.module.scss'

export type TextPlugin = {
  name: string;
  process: (content: React.ReactNode) => React.ReactNode;
}
export const urlPlugin: TextPlugin = {
  name: 'url',
  process: (content) => {
    if (typeof content !== 'string') return content

    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = content.split(urlRegex)

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'rgb(13, 205, 252)', textDecoration: 'none' }}
          >
            {part}
          </a>
        )
      }
      return part
    })
  },
}
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
  lineHeight?: number | string
  weight?: TextPropsFontWeight
  uppercase?: boolean
  nowrap?: boolean
  textElipsis?: boolean
  textAlign?: CSSProperties['textAlign']
  plugins?: TextPlugin[]; // New prop for plugins
}

const cn = makeCn('Text', styles)

export function Text(props: PropsWithChildren<TextCommonProps>) {
  const {
    className,
    fs,
    letterSpacing,
    uppercase,
    nowrap,
    textAlign,
    weight,
    style,
    textElipsis,
    as: As = 'span',
    children,
    lineHeight,
    plugins = [], // Default to empty array
    ...rest
  } = props

  const processContent = flow(plugins.map((plugin) => plugin.process))
  const processedChildren = processContent(children)

  return (
    <As
      style={{
        ...style,
        letterSpacing: typeof letterSpacing === 'number' ? `${letterSpacing}em` : undefined,
        lineHeight: typeof lineHeight === 'number' ? rem(lineHeight) : undefined,
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
      {processedChildren}
    </As>
  )
}
