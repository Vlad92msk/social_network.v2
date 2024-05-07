import { Dialog, DialogShort, SelectDialogType } from '../types/dialogs.type'

export const DIALOGS: Dialog[] = [
  { id: '1',
    participantsIds: ['1', '2'],
    type: SelectDialogType.PRIVATE,
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
    participantsIds: ['1', '2'],
    type: SelectDialogType.PUBLIC,
    title: 'Диалог с пользователелем 3',
    description: undefined,
    messages: [
      {
        id: '1',
        media: [],
        emojis: [],
        text: 'text1',
        forwardMessageId: undefined,
        dateRead: new Date('2024/02/04'),
        dateDeliver: new Date('2024/02/04'),
        author: {
          id: '3',
          name: 'contact 3',
          profileImage: 'base/me1',
        },
      },
      {
        id: '2',
        media: [],
        emojis: [],
        text: 'text2',
        forwardMessageId: undefined,
        dateRead: new Date('2024/02/04'),
        dateDeliver: new Date('2024/02/04'),
        author: {
          id: '3',
          name: 'contact 3',
          profileImage: 'base/me1',
        },
      },
      {
        id: '3',
        media: [],
        emojis: [],
        text: 'text3',
        forwardMessageId: undefined,
        dateRead: new Date('2024/02/04'),
        dateDeliver: new Date('2024/02/04'),
        author: {
          id: '3',
          name: 'contact 3',
          profileImage: 'base/me1',
        },
      },
    ] },
]

export const DIALOGS_SHORT: DialogShort[] = [
  {
    id: '1',
    type: SelectDialogType.PUBLIC,
    title: 'Публичный диалог',
    description: undefined,
    img: 'base/me1',
    lastMessage: {
      id: '3',
      media: [],
      emojis: [],
      text: 'Публичный диалог',
      forwardMessageId: undefined,
      dateRead: new Date('2024/02/04'),
      dateDeliver: new Date('2024/02/04'),
      author: {
        id: '3',
        name: 'contact 3',
        profileImage: 'base/me1',
      },
    },
  },
  { id: '2',
    type: SelectDialogType.PRIVATE,
    title: 'Приватный диалог',
    description: undefined,
    lastMessage: {
      id: '3',
      media: [],
      emojis: [],
      text: 'Приватный диалог текст',
      forwardMessageId: undefined,
      dateRead: new Date('2024/02/04'),
      dateDeliver: new Date('2024/02/04'),
      author: {
        id: '3',
        name: 'contact 3',
        profileImage: 'base/me',
      },
    } },
]
