const userSettings = {
  layoutVariant: '2',
}

export type UserSettings = typeof userSettings

interface RouteQueryParams {
  params: Promise<{ userId: string }>
}

export async function GET(req: Request, queryParams: RouteQueryParams) {
  const success = true // Это должно определяться на основе логики обработки providerData

  if (success) {
    return new Response(JSON.stringify(userSettings), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Получение настроек - что-то пошло не так' }), { status: 404 })
}
