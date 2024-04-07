import { get } from 'lodash'
import { getServerLocale } from './getServerLocale'
import { getMessages } from '../others'

export const getServerTranslate = async () => {
  const locale = getServerLocale()
  const messages = await getMessages(locale)

  return (key: string) => get(messages, key)
}
