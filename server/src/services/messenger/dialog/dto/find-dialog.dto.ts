import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsEnum, IsUUID } from 'class-validator'
import { PaginationAndSortingDto } from '@shared/dto'

export class FindDialogDto extends PaginationAndSortingDto {
    @ApiPropertyOptional({ description: 'Поисковый запрос' })
    @IsOptional()
    @IsString()
    search?: string

    @ApiPropertyOptional({ description: 'Тип диалога' })
    @IsOptional()
    @IsEnum(['private', 'public'])
    type?: 'private' | 'public'

    @ApiPropertyOptional({ description: 'ID участника диалога' })
    @IsOptional()
    @IsUUID('all')
    participant_id?: string
}
