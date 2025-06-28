import { useLocale } from '@hooks'
import { ChangeEventHandler } from 'react'
import { LOCALES } from '../../../../i18n/config.ts'
import { Locale } from '../../../../i18n/types.ts'
import { Icon } from '../../../ui'
import { Select } from '../../../ui/common/Select'
import { cn } from '../cn'

export function SelectLocale() {
  const { currentLocale, setLocale } = useLocale()

  const handleChangeLocation: ChangeEventHandler<HTMLSelectElement> = (e) => {
    setLocale(e.target.value as Locale)
  }

  return (
    <Select
      className={cn('SelectLocation')}
      placeholder="Выбрать язык"
      defaultValue={currentLocale}
      onChange={handleChangeLocation}
      icon={<Icon name="git" />}
    >
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>{locale}</option>
      ))}
    </Select>
  )
}
