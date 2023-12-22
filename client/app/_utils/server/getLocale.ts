import { cookies } from 'next/headers'
import { Locales } from '../../../middlwares/location'

export const getLocale = () => {
  const cookieStore = cookies()
  return (cookieStore.get('NEXT_LOCALE')?.value) as Locales
}
