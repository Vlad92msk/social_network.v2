import { USER_INFO } from '@api/users/data/userInfo.data'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('userIds')

  if (!ids) return new Response(JSON.stringify([]), { status: 200 })

  const users = USER_INFO.filter(({ id }) => ids.includes(id))
  const success = true // Это должно определяться на основе логики обработки providerData

  if (success) {
    return new Response(JSON.stringify(users), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Пользователь не найден' }), { status: 404 })
}
