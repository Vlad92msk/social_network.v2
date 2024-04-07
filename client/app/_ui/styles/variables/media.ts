import { isObject, isString } from '../../../_utils/others'

export enum MediaBreakScreen {
  XL = 1600,
  LG = 1400,
  LM = 1200,
  MD = 992,
  SM = 768,
  XS = 576,
  ES = 375,
}

export const mediaBreakpoints = {
  xl: MediaBreakScreen.XL,
  lg: MediaBreakScreen.LG,
  lm: MediaBreakScreen.LM,
  md: MediaBreakScreen.MD,
  sm: MediaBreakScreen.SM,
  xs: MediaBreakScreen.XS,
  es: MediaBreakScreen.ES,
}

export type MediaBreakKeys = keyof typeof mediaBreakpoints

export type AdaptiveVariables<Params> = Params | Partial<Record<MediaBreakKeys, Params>>


export const createBreakPoint = (propName: string, values: AdaptiveVariables<unknown>): object => {
  const cls = {}

  if (isObject(values)) {
    Object.entries(values as object)
      .forEach(([key, val]) => {
        cls[`${propName}--${key}`] = val
      })
  }

  if (isString(values)) {
    cls[`${propName}--default`] = values
  }

  return cls
}
