import { UserInfo } from '@api/users/types/user.type'
import { Message } from './message.type'

export enum SelectDialogType {
  PRIVATE ='private',
  PUBLIC = 'public'
}

export interface Dialog {
  id: string
  img?: string
  title?: string
  links?: string[]
  documents?: any[]
  photos?: any[]
  videos?: any[]
  fixedMessages?: Message[]
  options?: {
    hideMe?: boolean
    notify?: boolean
  }
  description?: string
  type: SelectDialogType
  participantsIds?: string[]
  messages?: Message[]
  lastMessage?: Message
}

export interface DialogResponse extends Dialog {
  participants: UserInfo[]
}

/**
 * Краткая инф отображаемая в списке диалогов
 */
export type DialogShort = Pick<
  Dialog,
  'id' |
  'img' |
  'title' |
  'description' |
  'type' |
  'lastMessage'
>
