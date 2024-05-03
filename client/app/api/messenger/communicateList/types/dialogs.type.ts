import { AddedFile } from '@hooks'

export interface EmojiAdded {
  emoji: any
  userId: string
}

export interface Message {
  id: string
  text: string
  media?: AddedFile[]
  forwardMessageId?: string
  dateDeliver: Date
  dateRead: Date
  emojis?: EmojiAdded[]
}

export interface Dialog {
  id: string
  title?: string
  description?: string
  type: 'public' | 'private'
  participants: any[]
  messages?: Message[]
}
