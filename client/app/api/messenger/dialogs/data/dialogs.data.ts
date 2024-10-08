// eslint-disable-next-line import/no-extraneous-dependencies
import { pick } from 'lodash'
import { Dialog, DialogShort, SelectDialogType } from '../types/dialogs.type'

const a = () => ({
  id: '1',
  media: undefined,
  emojis: [],
  text: 'text1',
  forwardMessageId: 'profile-message-1',
  dateRead: new Date('2024/02/04'),
  dateDeliver: new Date('2024/02/04'),
  dateCreated: new Date(),
  author: {
    id: '1',
    name: 'contact 1',
    profileImage: 'base/me',
  },
})

export const DIALOGS: Dialog[] = [
  {
    id: '1',
    participantsIds: ['1', '2'],
    type: SelectDialogType.PRIVATE,
    title: 'Диалог с пользователелем 2',
    description: undefined,
    lastMessage: {
      id: '3',
      media: undefined,
      emojis: [],
      text: 'private диалог',
      forwardMessageId: undefined,
      dateRead: new Date('2024/02/04'),
      dateDeliver: new Date('2024/02/04'),
      dateCreated: new Date(),
      author: {
        id: '2',
        name: 'contact 3',
        profileImage: 'base/me',
      },
    },
    messages: [
      {
        id: '1',
        media: undefined,
        emojis: [],
        text: 'text1',
        forwardMessageId: undefined,
        dateRead: new Date('2024/02/04'),
        dateDeliver: new Date('2024/02/04'),
        dateCreated: new Date(),
        author: {
          id: '1',
          name: 'contact 1',
          profileImage: 'base/me',
        },
      },
      {
        id: '2',
        media: undefined,
        emojis: [],
        text: 'text2',
        forwardMessageId: undefined,
        dateRead: new Date('2024/02/04'),
        dateDeliver: new Date('2024/02/04'),
        dateCreated: new Date(),
        author: {
          id: '2',
          name: 'contact 2',
          profileImage: 'base/me1',
        },
      },
      {
        id: '3',
        media: undefined,
        emojis: [],
        text: 'text3',
        forwardMessageId: undefined,
        dateRead: new Date('2024/02/04'),
        dateDeliver: new Date('2024/02/04'),
        dateCreated: new Date(),
        author: {
          id: '2',
          name: 'contact 2',
          profileImage: 'base/me1',
        },
      },
    ],
    fixedMessages: [a()],
  },
  {
    id: '2',
    participantsIds: ['1', '2'],
    type: SelectDialogType.PUBLIC,
    title: 'Публичный диалог',
    description: undefined,
    img: 'base/me1',
    lastMessage: {
      id: '3',
      media: undefined,
      emojis: [],
      text: 'Публичный диалог текст',
      forwardMessageId: undefined,
      dateRead: new Date('2024/02/04'),
      dateDeliver: new Date('2024/02/04'),
      dateCreated: new Date(),
      author: {
        id: '2',
        name: 'contact 3',
        profileImage: 'base/me',
      },
    },
    messages: [
      {
        id: '1',
        media: undefined,
        emojis: [],
        text: 'text1',
        forwardMessageId: undefined,
        dateRead: new Date('2024/02/04'),
        dateDeliver: new Date('2024/02/04'),
        dateCreated: new Date(),
        author: {
          id: '3',
          name: 'contact 3',
          profileImage: 'base/me1',
        },
      },
      {
        id: '2',
        media: undefined,
        emojis: [],
        text: 'text2',
        forwardMessageId: undefined,
        dateRead: new Date('2024/02/04'),
        dateDeliver: new Date('2024/02/04'),
        dateCreated: new Date(),
        author: {
          id: '3',
          name: 'contact 3',
          profileImage: 'base/me1',
        },
      },
      {
        id: '3',
        media: undefined,
        emojis: [],
        text: 'text3',
        forwardMessageId: undefined,
        dateRead: new Date('2024/02/04'),
        dateDeliver: new Date('2024/02/04'),
        dateCreated: new Date(),
        author: {
          id: '3',
          name: 'contact 3',
          profileImage: 'base/me1',
        },
      },
    ],
  },
]

export const DIALOGS_SHORT: DialogShort[] = DIALOGS.map((item) => pick(item, [
  'id',
  'img',
  'title',
  'description',
  'type',
  'lastMessage',
]))
