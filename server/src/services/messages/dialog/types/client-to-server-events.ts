import { DialogEvents } from '@services/messages/dialog/types/dialog-events-enum'
import { CreateMessageDto } from '@services/messages/message/dto/create-message.dto'

export interface ClientToServerEvents {
    [DialogEvents.JOIN_DIALOG]: (data: { dialogId: string; per_page?: number; page?: number }) => void
    [DialogEvents.LEAVE_DIALOG]: (dialogId: string) => void;
    [DialogEvents.SEND_MESSAGE]: (data: { dialogId: string; createMessageDto: CreateMessageDto; media: Express.Multer.File[]; voices: Express.Multer.File[]; videos: Express.Multer.File[] }) => void
    [DialogEvents.START_TYPING]: (dialogId: string) => void;
    [DialogEvents.STOP_TYPING]: (dialogId: string) => void
}
