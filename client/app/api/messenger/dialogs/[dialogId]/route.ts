import { DIALOGS } from '../data/dialogs.data'

interface RouteQueryParams {
  params: { dialogId: string }
}

export async function GET(request: Request, params: RouteQueryParams) {
  const { dialogId } = params.params
  const success = true

  if (success) {
    return new Response(JSON.stringify(DIALOGS.find(({ id }) => id === dialogId)), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Получение диалогов - что-то пошло не так' }), { status: 404 })
}
