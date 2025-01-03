import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsEnum, IsOptional, IsArray, IsUUID, IsObject, IsNumber } from 'class-validator'

export class CreateDialogDto {
    @ApiProperty({ description: 'Заголовок диалога', required: false })
    @IsOptional()
    @IsString()
    title?: string

    @ApiProperty({ description: 'Фото диалога', required: false })
    @IsOptional()
    @IsString()
    image?: string

    @ApiProperty({ description: 'Описание диалога', required: false })
    @IsOptional()
    @IsString()
    description?: string

    @ApiProperty({ description: 'Тип диалога', required: false })
    @IsEnum(['private', 'public'])
    @IsOptional()
    type?: 'private' | 'public'

    @ApiProperty({ description: 'ID участников диалога', type: [Number], required: false })
    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    participants?: number[]

    @ApiProperty({ description: 'Настройки диалога', required: false })
    @IsOptional()
    @IsObject()
    options?: {
        hide_me?: boolean;
        notify?: boolean;
    }
}
