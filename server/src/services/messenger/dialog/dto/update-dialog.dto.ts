// update-dialog.dto.ts
import { ApiProperty } from '@nestjs/swagger'
import { IsArray, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator'

export class UpdateDialogDto {
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

  @ApiProperty({ description: 'Тип диалога' })
  @IsEnum(['private', 'public'])
  type: 'private' | 'public'

  @ApiProperty({ description: 'ID добавляемых участников', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  add_participants?: number[]

  @ApiProperty({ description: 'ID удаляемых участников', type: [Number] })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  remove_participants?: number[]
}
