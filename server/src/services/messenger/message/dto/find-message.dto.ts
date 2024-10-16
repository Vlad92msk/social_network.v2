import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsIn, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator'

export class FindMessageDto {
    @ApiPropertyOptional({ description: 'ID диалога' })
    @IsOptional()
    @IsString()
    dialog_id?: string

    @ApiPropertyOptional({ description: 'Значение тега' })
    @IsOptional()
    @IsString()
    value?: string

    @ApiPropertyOptional({ description: 'Название тега' })
    @IsOptional()
    @IsString()
    name?: string

    @ApiPropertyOptional({ description: 'Поисковый запрос' })
    @IsOptional()
    @IsString()
    search?: string

    @ApiPropertyOptional({ description: 'Минимальное количество пересылок' })
    @IsOptional()
    @IsNumber()
    forward_count_min?: number

    @ApiPropertyOptional({ description: 'Максимальное количество пересылок' })
    @IsOptional()
    @IsNumber()
    forward_count_max?: number

    @ApiPropertyOptional({ description: 'Начальная дата создания' })
    @IsOptional()
    @IsDate()
    date_created_from?: Date

    @ApiPropertyOptional({ description: 'Конечная дата создания' })
    @IsOptional()
    @IsDate()
    date_created_to?: Date

    @ApiPropertyOptional({ description: 'Курсор для пагинации (ID последнего загруженного сообщения)' })
    @IsOptional()
    @IsString()
    cursor?: string

    @ApiPropertyOptional({ description: 'Количество сообщений для загрузки', default: 10 })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({ description: 'Поле для сортировки', enum: ['date_created'] })
    @IsString()
    @IsOptional()
    @IsIn(['date_created'])
    sort_by? = 'date_created'

    @ApiPropertyOptional({ description: 'Направление сортировки', enum: ['DESC', 'ASC'] })
    @IsString()
    @IsOptional()
    @IsIn(['DESC', 'ASC'])
    sort_direction?: 'DESC' | 'ASC' = 'DESC'
}
