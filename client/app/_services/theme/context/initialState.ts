export type Theme = 'default' | 'red' | 'orange'

/* Язык по умолчанию */
export const DEFAULT_THEME: Theme = 'default'

export interface ThemeServiceContext {
  theme: Theme;
}


export const initialState: ThemeServiceContext = {
  theme: DEFAULT_THEME,
}
