import { DIALOGS, DIALOGS_SHORT } from '../data/dialogs.data'

interface RouteQueryParams {
  // params: { param: string }
}

export async function GET(request: Request, params: RouteQueryParams) {
  const { searchParams } = new URL(request.url)
  const ids = searchParams.get('dialogIds')
  const isShorts = searchParams.get('isShorts')
  const success = true

  if (success) {
    return new Response(
      JSON.stringify(
        isShorts
          ? DIALOGS_SHORT.filter(({ id }) => ids?.includes(id))
          : DIALOGS.filter(({ id }) => ids?.includes(id))
      )
    )
  }
  return new Response(JSON.stringify({ error: 'Получение диалогов - что-то пошло не так' }), { status: 404 })
}
