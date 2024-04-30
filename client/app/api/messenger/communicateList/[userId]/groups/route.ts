import { Group } from '../../types'

const GROUPS: Group[] = [
  { id: '10', img: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '11', img: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '12', img: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '13', img: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '14', img: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '15', img: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
  { id: '16', img: 'base/me', name: 'Friend 5', lastContactMessage: 'Friend 9', lastMessage: 'last long message last long message last long message last long message' },
]


interface RouteQueryParams {
  params: { userId: string }
}

export async function GET(req: Request, res: RouteQueryParams) {
  const providerData = res.params.userId

  const success = true // Это должно определяться на основе логики обработки providerData

  if (success) {
    return new Response(JSON.stringify(GROUPS), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Получение настроек - что-то пошло не так' }), { status: 404 })
}
