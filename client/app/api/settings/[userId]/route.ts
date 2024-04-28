const userSettings = {
  layoutVariant: '2',
}

export type UserSettings = typeof userSettings

interface RouteQueryParams {
  params: { userId: string }
}

export async function GET(req: Request, res: RouteQueryParams) {
  const providerData = res.params.userId

  const success = true // Это должно определяться на основе логики обработки providerData

  if (success) {
    return new Response(JSON.stringify(userSettings), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Получение настроек - что-то пошло не так' }), { status: 404 })
}
