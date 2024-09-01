import { PartialType } from '@nestjs/mapped-types'
import { CreatePostDto } from './create-post.dto'
import { IsArray, IsOptional, IsUUID } from 'class-validator'

export class UpdatePostDto extends PartialType(CreatePostDto) {
    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    remove_media_ids: string[]

    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    remove_voice_ids: string[]

    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    remove_video_ids: string[]

    @IsArray()
    @IsUUID('all', { each: true })
    @IsOptional()
    remove_tag_ids: string[]
}
