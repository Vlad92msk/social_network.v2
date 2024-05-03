import { Dialog } from '../../../types'

const DIALOGS: Dialog[] = [
  { id: '1',
    participants: ['1', '2'],
    type: 'private',
    title: 'Диалог с пользователелем 2',
    description: undefined,
    messages: [
      {
        id: '1', media: [], emojis: [], text: 'text1', forwardMessageId: undefined, dateRead: new Date('2024/02/04'), dateDeliver: new Date('2024/02/04'),
      },
      {
        id: '2', media: [], emojis: [], text: 'text2', forwardMessageId: undefined, dateRead: new Date('2024/02/04'), dateDeliver: new Date('2024/02/04'),
      },
      {
        id: '3', media: [], emojis: [], text: 'text3', forwardMessageId: undefined, dateRead: new Date('2024/02/04'), dateDeliver: new Date('2024/02/04'),
      },
    ] },
  { id: '2',
    participants: ['1', '3'],
    type: 'private',
    title: 'Диалог с пользователелем 3',
    description: undefined,
    messages: [
      {
        id: '1', media: [], emojis: [], text: 'text1', forwardMessageId: undefined, dateRead: new Date('2024/02/04'), dateDeliver: new Date('2024/02/04'),
      },
      {
        id: '2', media: [], emojis: [], text: 'text2', forwardMessageId: undefined, dateRead: new Date('2024/02/04'), dateDeliver: new Date('2024/02/04'),
      },
      {
        id: '3', media: [], emojis: [], text: 'text3', forwardMessageId: undefined, dateRead: new Date('2024/02/04'), dateDeliver: new Date('2024/02/04'),
      },
    ] },
]

interface RouteQueryParams {
  params: { userId: string, dialogId: string }
}

export async function GET(req: Request, res: RouteQueryParams) {
  const { dialogId, userId } = res.params
  const success = true // Это должно определяться на основе логики обработки providerData

  if (success) {
    return new Response(JSON.stringify(DIALOGS.find(({ id, participants }) => id === dialogId && participants.includes(userId))), { status: 200 })
  }
  return new Response(JSON.stringify({ error: 'Получение диалогов - что-то пошло не так' }), { status: 404 })
}
