import { PROFILE } from '@api/profiles/data/profile.data'

interface ProfileQueryParams {
  params: { profileId: string }
}

export async function GET(req: Request, params: ProfileQueryParams) {
  const { profileId } = params.params

  const userData = PROFILE.find(({ id }) => id === profileId)
  const success = true

  if (success) {
    return new Response(JSON.stringify(userData), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Профиль не найден' }), { status: 404 })
}


export async function POST(req: Request, params: ProfileQueryParams) {
  const { profileId } = params.params
  const providerData = await req.json()

  /**
   * TODO: на бэке ищем пользователя с profileId
   * Если такого нет - создаем  |  генеририруем наш токен и возвращаем его профиль
   * Если есть                  |  генеририруем наш токен и возвращаем его профиль
   */

  const userData = PROFILE.find(({ id }) => id === providerData.email)
  const success = true // Это должно определяться на основе логики обработки providerData

  if (success) {
    return new Response(JSON.stringify(userData), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Ошибка создания/получения профиля' }), { status: 404 })
}
