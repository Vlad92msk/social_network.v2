import { getUsersProfilesQuery } from '../../../../_query'
import { DIALOGS } from '../data/dialogs.data'

interface RouteQueryParams {
  params: { dialogId: string }
}

export async function GET(request: Request, params: RouteQueryParams) {
  const { dialogId } = params.params
  const dialog = DIALOGS.find(({ id }) => id === dialogId)

  const participantsIds = dialog?.participantsIds

  const participants = await getUsersProfilesQuery(participantsIds)

  const result = {
    ...dialog,
    participants,
  }

  const success = true

  if (success) {
    return new Response(JSON.stringify(result), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Получение диалогов - что-то пошло не так' }), { status: 404 })
}
