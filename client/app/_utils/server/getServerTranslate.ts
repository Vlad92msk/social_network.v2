import { get } from 'lodash'
import { getServerLocale } from './getServerLocale'
import { getMessages } from '../others'

export const getServerTranslate = async () => {
  const locale = await getServerLocale()
  const messages = await getMessages(locale)

  return (key: string): string => get(messages, key)
}
