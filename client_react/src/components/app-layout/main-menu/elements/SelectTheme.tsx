import { ChangeEventHandler } from 'react'
import { Select } from '@components/ui'

import { useThemeServiceUpdate } from '../../../../providers/theme'
import { DEFAULT_THEME, Theme, THEMES } from '../../../../providers/theme/context/initialState.ts'
import { Icon } from '../../../ui'
import { cn } from '../cn'

export function SelectTheme() {
  const updateTheme = useThemeServiceUpdate()

  const handleChangeTheme: ChangeEventHandler<HTMLSelectElement> = (v) => {
    updateTheme((ctx) => ({ ...ctx, theme: v.target.value as Theme }))
  }

  return (
    <Select className={cn('SelectTheme')} placeholder="Выбрать тему" defaultValue={DEFAULT_THEME} onChange={handleChangeTheme} icon={<Icon name="git" />}>
      {THEMES.map((theme) => (
        <option key={theme} value={theme}>
          {theme}
        </option>
      ))}
    </Select>
  )
}
