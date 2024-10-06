import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsUUID, IsOptional, IsBoolean, IsArray, IsNumber } from 'class-validator'
import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { MessageEntity } from '../entity/message.entity'

export class CreateMessageDto extends IntersectionType(
    PartialType(PickType(MessageEntity, [
        'text', 'is_forwarded'
    ])),
)  {
    @ApiProperty({ description: 'ID диалога к которому относится сообщение' })
    @IsOptional()
    @IsString()
    dialog_id?: string

    //_____________________________________
    @ApiProperty({ description: 'ID участников диалога (если диалог создается впервые и сразу выбран пользователь)', type: [Number] })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    participants?: number[]

    @ApiProperty({ description: 'Новый диалог?', required: false })
    @IsOptional()
    @IsBoolean()
    is_new_dialog?: boolean
    //_____________________________________




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
