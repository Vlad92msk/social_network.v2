import { DialogShortDto } from '../../../../../swagger/dialogs/interfaces-dialogs'
import { dialogsApiInstance } from '../../../../store/instance'

export const getDialogsShortQuery = async ({ locale, userId, userInfoIdCookie, profileIdCookie }: {
  locale?: string,
  userId?: string,
  userInfoIdCookie: any
  profileIdCookie: any
}): Promise<DialogShortDto[]> => {
  const headers = new Headers()
  // Добавляем нужные куки в заголовки
  headers.append('Cookie', `${userInfoIdCookie.name}=${userInfoIdCookie.value}; ${profileIdCookie.name}=${profileIdCookie.value}`)

  const { url, init } = dialogsApiInstance.findAllShortDialogsInit({})
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  })
  if (!response.ok) {
    throw new Error('getDialogsShortQuery ошибка получения диалогов')
  }

  return response.json()
}
