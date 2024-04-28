import { useParams, useRouter } from 'next/navigation'
import { Locales } from '@middlewares/location'
import { NavigationContentType } from '../types'

export const useSwitchContent = () => {
  const { locale, userId } = useParams<{locale: Locales, userId: string}>()
  const router = useRouter()

  return (to: NavigationContentType) => router.push(`/${locale}/${userId}/${to}`)
}
