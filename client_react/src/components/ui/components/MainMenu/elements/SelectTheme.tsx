import { ChangeEventHandler } from 'react'
import { useThemeServiceUpdate } from '../../../../../providers/theme'
import { DEFAULT_THEME, Theme, THEMES } from '../../../../../providers/theme/context/initialState.ts'
import { Select } from '../../../common/Select'
import { Icon } from '../../../icon'
import { cn } from '../cn'

export function SelectTheme() {
  const updateTheme = useThemeServiceUpdate()

  const handleChangeTheme: ChangeEventHandler<HTMLSelectElement> = (v) => {
    updateTheme((ctx) => ({ ...ctx, theme: v.target.value as Theme }))
  }

  return (
    <Select
      className={cn('SelectTheme')}
      placeholder="Выбрать тему"
      defaultValue={DEFAULT_THEME}
      onChange={handleChangeTheme}
      icon={<Icon name="git" />}
    >
      {THEMES.map((theme) => (
        <option key={theme} value={theme}>{theme}</option>
      ))}
    </Select>
  )
}
