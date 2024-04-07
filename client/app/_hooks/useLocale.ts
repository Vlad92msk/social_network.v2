import { useTranslateSelect } from '@providers/translation'

export const useLocale = () => useTranslateSelect((s) => s.locale)
