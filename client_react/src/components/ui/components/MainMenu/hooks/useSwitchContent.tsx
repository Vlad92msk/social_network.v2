import { useNavigate, useParams } from 'react-router-dom'
import { Locale } from '../../../../../i18n/types.ts'
import { NavigationContentType } from '../types'

export const useSwitchContent = () => {
  const { locale, userId } = useParams<{locale: Locale, userId: string}>()
  const navigate = useNavigate()

  return (to: NavigationContentType, options?: { replace?: boolean }) => {
    navigate(`/${locale}/${userId}/${to}`, options)
  }
}
