import { ApiProperty } from '@nestjs/swagger'
import { TransformToArray } from '@shared/decorators'
import { IsString, IsUUID, IsOptional, IsBoolean, IsArray } from 'class-validator'
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { MessageEntity } from '../entity/message.entity'

export class CreateMessageDto extends IntersectionType(
    PartialType(PickType(MessageEntity, [
        'text', 'is_forwarded'
    ])),
)  {
    @ApiProperty({ description: 'ID участников диалога (для новых создаваемых диалогов)', required: false, type: [Number] })
    @IsOptional()
    @IsArray()
    @TransformToArray()
    participants?: number[]

    @ApiProperty({ description: 'ID диалога к которому относится сообщение' })
    @IsOptional()
    @IsString()
    dialog_id?: string

    @ApiProperty({ description: 'Текст сообщения' })
    @IsString()
    text: string

    @ApiProperty({ description: 'ID сообщения, на которое отвечает данное сообщение', required: false })
    @IsOptional()
    @IsUUID()
    reply_to_id?: string

    @ApiProperty({ description: 'ID оригинального сообщения, если это пересылка', required: false })
    @IsOptional()
    @IsUUID()
    original_message_id?: string

    @ApiProperty({ description: 'ID медиафайлов, прикрепленных к сообщению (выбор из существующих в системе)', required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    media_ids?: string[]

    @ApiProperty({ description: 'Является ли сообщение пересланным', required: false })
    @IsOptional()
    @IsBoolean()
    is_forwarded?: boolean
}
