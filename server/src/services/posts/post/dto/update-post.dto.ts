import { PartialType } from '@nestjs/mapped-types'
import { CreatePostDto } from './create-post.dto'
import { IsArray, IsOptional, IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class UpdatePostDto extends PartialType(CreatePostDto) {
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

    @ApiProperty({ description: 'ID тегов для удаления', type: [String], required: false })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    remove_tag_ids: string[]
}
