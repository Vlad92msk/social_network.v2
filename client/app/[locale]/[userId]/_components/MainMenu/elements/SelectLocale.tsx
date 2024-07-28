import { LOCALES } from '@middlewares/variables'
import { Icon } from 'app/_ui/common/Icon'
import { useLocale } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { ChangeEventHandler } from 'react'
import { Select } from 'app/_ui/common/Select'
import { cn } from '../cn'

export function SelectLocale() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  const handleChangeLocation: ChangeEventHandler<HTMLSelectElement> = (e) => {
    const newUrl = pathname.replace(/\/[a-z]{2}\//, `/${e.target.value}/`)
    router.push(newUrl)
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
