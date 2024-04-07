import { get } from 'lodash'
import { getMessages } from './getMessages'
import { Locales } from '../../../middlwares/location'

export type GetTranslate = (key: string) => any
export const getTranslate = async (locale: Locales): Promise<GetTranslate> => {
  const messages = await getMessages(locale)

  return (key: string) => get(messages, key)
}
