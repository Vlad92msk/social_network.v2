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
  participants?: any[]
  messages?: Message[]
  lastMessage?: Message
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
