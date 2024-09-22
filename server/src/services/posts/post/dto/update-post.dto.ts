import { PartialType } from '@nestjs/mapped-types'
import { ApiProperty } from '@nestjs/swagger'
import { PostVisibility } from '@services/posts/post/entities/post.entity'
import { IsArray, IsEnum, IsOptional, IsUUID, IsBoolean, IsString } from 'class-validator'
import { CreatePostDto } from './create-post.dto'

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @ApiProperty({ description: 'Текст поста', type: String, required: false })
    @IsString()
    @IsOptional()
    text: string

    @ApiProperty({ description: 'Заголовок', type: String, required: false })
    @IsString()
    @IsOptional()
    title: string


    @ApiProperty({ description: 'Закреплено/откреплено', type: Boolean, required: false })
    @IsBoolean()
    @IsOptional()
    pinned: boolean

    @ApiProperty({ description: 'Видимость поста', enum: PostVisibility, required: false })
    @IsOptional()
    @IsEnum(PostVisibility)
    visibility: PostVisibility

    @ApiProperty({ description: 'ID тегов для добавления', type: [String], required: false })
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    tag_ids: string[]

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
