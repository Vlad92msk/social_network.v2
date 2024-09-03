import { IntersectionType, PartialType, PickType } from '@nestjs/mapped-types'
import { IsDate, IsIn, IsNumber, IsOptional, IsString } from 'class-validator'
import { PaginationAndSortingDto } from '@shared/dto'
import { ApiPropertyOptional } from '@nestjs/swagger'
import { MessageEntity } from '@services/messages/message/entity/message.entity'
import { Type } from 'class-transformer'

export class FindMessageDto extends IntersectionType(
    PartialType(PickType(MessageEntity, ['text', 'type', 'id', 'is_forwarded', 'forward_count', 'date_created'])),
    PaginationAndSortingDto<MessageEntity>
) {
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
    @Type(() => Number)
    forward_count_min?: number

    @ApiPropertyOptional({ description: 'Максимальное количество пересылок' })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    forward_count_max?: number

    @ApiPropertyOptional({ description: 'Начальная дата создания' })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    date_created_from?: Date

    @ApiPropertyOptional({ description: 'Конечная дата создания' })
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    date_created_to?: Date

    @ApiPropertyOptional({ description: 'Поле для сортировки', enum: ['value', 'name', 'entity_type'] })
    @IsString()
    @IsOptional()
    @IsIn(['text', 'type', 'is_forwarded', 'forward_count', 'date_created'])
    sort_by?: 'text' | 'type' | 'is_forwarded' | 'forward_count' | 'date_created'
}
