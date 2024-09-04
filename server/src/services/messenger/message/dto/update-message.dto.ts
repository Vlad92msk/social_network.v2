import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator'
import { PartialType } from '@nestjs/mapped-types'
import { CreateMessageDto } from './create-message.dto'

export class UpdateMessageDto extends PartialType(CreateMessageDto) {
    @ApiProperty({ description: 'Текст сообщения', required: false })
    @IsOptional()
    @IsString()
    text?: string

    @ApiProperty({ description: 'ID медиафайлов, прикрепленных к сообщению', required: false, type: [String] })
    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    media_ids?: string[]

    @ApiProperty({ description: 'Является ли сообщение пересланным', required: false })
    @IsOptional()
    @IsBoolean()
    is_forwarded?: boolean

    @ApiProperty({ description: 'ID медиафайлов для удаления', type: [String], required: false })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    remove_media_ids: string[]

    @ApiProperty({ description: 'ID голосовых сообщений для удаления', type: [String], required: false })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    remove_voice_ids: string[]

    @ApiProperty({ description: 'ID видео для удаления', type: [String], required: false })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    remove_video_ids: string[]
}
