import { ChangeEventHandler } from 'react'
import { useThemeServiceUpdate } from '@providers/theme'
import { DEFAULT_THEME, Theme, THEMES } from '@providers/theme/context/initialState'
import { BaseIcon } from '@ui/base/BaseIcon'
import { CommonSelect } from '@ui/common/CommonSelect'
import { cn } from '../cn'

export function SelectTheme() {
  const updateTheme = useThemeServiceUpdate()

  const handleChangeTheme: ChangeEventHandler<HTMLSelectElement> = (v) => {
    updateTheme((ctx) => ({ ...ctx, theme: v.target.value as Theme }))
  }

  return (
    <CommonSelect
      className={cn('SelectTheme')}
      width="auto"
      size="xs"
      placeholder="Выбрать тему"
      defaultValue={DEFAULT_THEME}
      onChange={handleChangeTheme}
      icon={<BaseIcon name="git" />}
    >
      {THEMES.map((theme) => (
        <option key={theme} value={theme}>{theme}</option>
      ))}
    </CommonSelect>
  )
}
