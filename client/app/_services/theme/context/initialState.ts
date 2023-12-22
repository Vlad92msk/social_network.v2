export type Theme = 'default' | 'light'

/* Язык по умолчанию */
export const DEFAULT_THEME: Theme = 'default'
export const THEMES: Theme[] = ['light', 'default']

export interface ThemeServiceContext {
  theme: Theme;
}


export const initialState: ThemeServiceContext = {
  theme: DEFAULT_THEME,
}
