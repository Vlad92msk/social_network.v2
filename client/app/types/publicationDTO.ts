import { EmojiClickData } from 'emoji-picker-react'
import { UserInfo } from '@api/users/types/user.type'
import { CommentDTO } from './commentDTO'

interface FileObject {
  name: string,
  src: string,
  type: string,
  size: number,
  lastModified: string,
  blob: Blob
}

interface PublicationReactionsDTO extends EmojiClickData {
  fromUserId: string
}
export interface PublicationMediaDTO {
  image: FileObject[],
  audio: FileObject[],
  video: FileObject[],
  text: FileObject[],
  other: FileObject[]
}

export interface PublicationDTO {
  id: string
  text: string
  voices?: any[]
  videos?: any[]
  forwardMessageId?: string
  media?: PublicationMediaDTO
  dateCreated: Date
  dateDeliver?: Date
  dateChanged?: Date
  dateRead?: Date
  emojis?: PublicationReactionsDTO[]
  author?: UserInfo
  comments?: CommentDTO[]
}
