import { Contact } from '../../types'

const CONTACTS: Contact[] = [
  { id: '1', img: 'base/me', name: 'Friend 1', lastMessage: 'last long message last long message last long message last long message' },
  { id: '2', img: 'base/me', name: 'Friend 2', lastMessage: 'last long message last long message last long message last long message' },
  { id: '3', img: 'base/me', name: 'Friend 3', lastMessage: 'last long message last long message last long message last long message' },
  { id: '4', img: 'base/me', name: 'Friend 4', lastMessage: 'last long message last long message last long message last long message' },
  { id: '5', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '6', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '7', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '8', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '9', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '10', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '11', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '12', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '13', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '14', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '15', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
  { id: '16', img: 'base/me', name: 'Friend 5', lastMessage: 'last long message last long message last long message last long message' },
]

interface RouteQueryParams {
  params: { userId: string }
}

export async function GET(req: Request, res: RouteQueryParams) {
  const providerData = res.params
  // console.log('providerData', providerData)
  const success = true // Это должно определяться на основе логики обработки providerData

  if (success) {
    return new Response(JSON.stringify(CONTACTS), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Получение настроек - что-то пошло не так' }), { status: 404 })
}
