import { USER_INFO } from '../data/userInfo.data'

interface RouteQueryParams {
  params: { userId: string }
}

export async function GET(req: Request, res: RouteQueryParams) {
  const { userId } = res.params

  const success = true // Это должно определяться на основе логики обработки providerData

  if (success) {
    return new Response(JSON.stringify(USER_INFO.find(({ id }) => id === userId)), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Получение настроек - что-то пошло не так' }), { status: 404 })
}
