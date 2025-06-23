import { Property } from 'csstype'

export const rem = (size: string | number | undefined): Property.Width<string> | undefined => (size ? `${Number(size) / 16}rem` : undefined)
