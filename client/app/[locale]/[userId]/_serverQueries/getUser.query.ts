import { UserInfoDto } from '../../../../../swagger/userInfo/interfaces-userInfo'
import { userInfoApiInstance } from '../../../../store/instance'

export const getUserQuery = async ({ userInfoIdCookie, profileIdCookie, public_id }: {
  userInfoIdCookie: any
  profileIdCookie: any
  public_id: any
}): Promise<UserInfoDto | null> => {
  const headers = new Headers()
  // Добавляем нужные куки в заголовки
  headers.append('Cookie', `${userInfoIdCookie.name}=${userInfoIdCookie.value}; ${profileIdCookie.name}=${profileIdCookie.value}`)

  const { url, init } = userInfoApiInstance.getOneUserByParamsInit({ public_id })
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers,
  })

  if (!response.ok) {
    if (response.status === 404) {
      // Пользователь не найден, возвращаем null
      return null
    }
    throw new Error(`getUserQuery ошибка получения пользователя: ${response.status}`)
  }

  const text = await response.text()
  if (!text) {
    // Если ответ пустой, возвращаем null
    return null
  }

  try {
    const data = JSON.parse(text)
    return data
  } catch (error) {
    console.error('Ошибка при парсинге JSON:', error)
    return null
  }
}
