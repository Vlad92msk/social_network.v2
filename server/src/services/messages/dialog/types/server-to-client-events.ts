import { DialogEvents } from '@services/messages/dialog/types/dialog-events-enum'
import { MessageEntity } from '@services/messages/message/entity/message.entity'
import { UserStatus } from '@services/users/_interfaces'
import { PaginationResponse } from '@shared/utils'
import { UserInfo } from '@services/users/user-info/entities'
import { DialogShortDto } from '@services/messages/dialog/dto/dialog-short.dto'
import { DialogEntity } from '@services/messages/dialog/entities/dialog.entity'

export interface ServerToClientEvents {
    [DialogEvents.NEW_MESSAGE]: (message: MessageEntity) => void
    [DialogEvents.USER_STATUS_CHANGED]: (data: { userId: number; status: UserStatus; activeParticipants?: number[] }) => void
    [DialogEvents.DIALOG_HISTORY]: (data: { messages: PaginationResponse<MessageEntity[]>; participants: UserInfo[]; activeParticipants: number[] }) => void
    [DialogEvents.DIALOG_SHORT_UPDATED]: (data: DialogShortDto) => void
    [DialogEvents.DIALOG_UPDATED]: (data: DialogEntity) => void
    [DialogEvents.USER_TYPING]: (data: { userId: number; isTyping: boolean }) => void
    [DialogEvents.VIDEO_CONFERENCE_STARTED]: (data: { dialogId: string, initiatorId: number }) => void
    [DialogEvents.VIDEO_CONFERENCE_ENDED]: (data: { dialogId: string, initiatorId: number }) => void
    error: (data: { message: string; error: string }) => void
}
