import { Locale } from '@middlewares/variables'
import { useParams, useRouter } from 'next/navigation'
import { NavigationContentType } from '../types'

export const useSwitchContent = () => {
  const { locale, userId } = useParams<{locale: Locale, userId: string}>()
  const router = useRouter()
  return (to: NavigationContentType) => router.push(`/${locale}/${userId}/${to}`)
}
