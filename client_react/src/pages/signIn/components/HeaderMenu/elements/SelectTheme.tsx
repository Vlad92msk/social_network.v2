import { ChangeEventHandler } from 'react'
import { Select } from '../../../../../components/ui/common/Select'
import { useThemeServiceUpdate } from '../../../../../providers/theme'
import { DEFAULT_THEME, Theme, THEMES } from '../../../../../providers/theme/context/initialState.ts'
import { cn } from '../cn.ts'

export function SelectTheme() {
  const updateTheme = useThemeServiceUpdate()

  const handleChangeTheme: ChangeEventHandler<HTMLSelectElement> = (v) => {
    updateTheme((ctx) => ({ ...ctx, theme: v.target.value as Theme }))
  }

  return (
    <Select
      className={cn('SelectTheme')}
      width="auto"
      size="xs"
      placeholder="Выбрать тему"
      defaultValue={DEFAULT_THEME}
      onChange={handleChangeTheme}

    >
      {THEMES.map((theme) => (
        <option key={theme} value={theme}>{theme}</option>
      ))}
    </Select>
  )
}
