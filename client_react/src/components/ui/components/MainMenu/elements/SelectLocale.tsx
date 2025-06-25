import { useLocale } from '@hooks'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChangeEventHandler } from 'react'
import { LOCALES } from '../../../../../i18n/config.ts'
import { Select } from '../../../common/Select'
import { Icon } from '../../../icon'
import { cn } from '../cn'

export function SelectLocale() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentLocale } = useLocale()

  const handleChangeLocation: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const newLocale = e.target.value

    // Заменяем локаль в текущем пути
    const newPathname = location.pathname.replace(/\/[a-z]{2}\//, `/${newLocale}/`)

    // Сохраняем query параметры и hash
    const newUrl = newPathname + location.search + location.hash

    navigate(newUrl)
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
