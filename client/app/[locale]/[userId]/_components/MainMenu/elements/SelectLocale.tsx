import { IconBase } from 'app/_ui/base/IconBase'
import { usePathname, useRouter } from 'next/navigation'
import { ChangeEventHandler } from 'react'
import { useLocale } from '@hooks'
import { Locales, LOCALES } from '@middlewares/location'
import { useTranslateUpdate } from '@providers/translation'
import { SelectCommon } from 'app/_ui/common/SelectCommon'
import { cn } from '../cn'

export function SelectLocale() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()
  const updateLocation = useTranslateUpdate()

  const handleChangeLocation: ChangeEventHandler<HTMLSelectElement> = (e) => {
    updateLocation((ctx) => ({ ...ctx, locale: e.target.value as Locales }))
    const newUrl = pathname.replace(/\/[a-z]{2}\//, `/${e.target.value}/`)
    router.push(newUrl)
  }

  return (
    <SelectCommon
      className={cn('SelectLocation')}
      width="auto"
      size="xs"
      placeholder="Выбрать язык"
      defaultValue={currentLocale}
      onChange={handleChangeLocation}
      icon={<IconBase name="git" />}
    >
      {LOCALES.map((locale) => (
        <option key={locale} value={locale}>{locale}</option>
      ))}
    </SelectCommon>
  )
}
