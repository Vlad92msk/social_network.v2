import { UserInfo } from '@api/users/types/user.type'
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
  dateCreated: Date
  dateDeliver?: Date
  dateChanged?: Date
  dateRead?: Date
  emojis?: EmojiAdded[]
  author?: UserInfo
}
