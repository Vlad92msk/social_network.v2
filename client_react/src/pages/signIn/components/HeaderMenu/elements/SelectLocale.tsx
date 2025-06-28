import { ChangeEventHandler } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Select } from '@components/ui'
import { useLocale } from '@hooks'

// import { useTranslateUpdate } from '@providers/translation'
import { LOCALES } from '../../../../../i18n/config.ts'
import { cn } from '../cn.ts'

export function SelectLocale() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentLocale } = useLocale()

  const handleChangeLocation: ChangeEventHandler<HTMLSelectElement> = (e) => {
    // updateLocation((ctx) => ({ ...ctx, locale: e.target.value as Locales }))
    const newLocale = e.target.value

    // Заменяем локаль в текущем пути
    const newPathname = location.pathname.replace(/\/[a-z]{2}\//, `/${newLocale}/`)

    // Сохраняем query параметры и hash
    const newUrl = newPathname + location.search + location.hash

    navigate(newUrl)
  }

  return (
    <Select className={cn('SelectLocation')} width="auto" size="xs" placeholder="Выбрать язык" defaultValue={currentLocale} onChange={handleChangeLocation}>
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>
          {locale}
        </option>
      ))}
    </Select>
  )
}
