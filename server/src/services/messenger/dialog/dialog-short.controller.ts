import { Controller, Get, Query, Param, UseInterceptors, Res } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger'
import { Response } from 'express'
import { DialogService } from './dialog.service'
import { DialogShortDto } from './dto/dialog-short.dto'
import { FindDialogDto } from './dto/find-dialog.dto'
import { RequestParams } from '@shared/decorators'
import { createPaginationHeaders } from '@shared/utils'

@ApiTags('Краткие диалоги')
@Controller('api/dialogs-short')
export class DialogShortController {
    constructor(private readonly dialogService: DialogService) {}

    @Get()
    @ApiOperation({ summary: 'Получить список кратких диалогов' })
    @ApiResponse({ status: 200, description: 'Список кратких диалогов', type: [DialogShortDto] })
    async findAllShortDialogs(
        @Query() query: FindDialogDto,
        @RequestParams() params: RequestParams,
        @Res({ passthrough: true }) response: Response
    ): Promise<DialogShortDto[]> {
        const { data, paginationInfo } = await this.dialogService.findAllShort(query, params)
        response.set(createPaginationHeaders(paginationInfo))
        return data
    }

    @Get(':id')
    @ApiOperation({ summary: 'Получить краткий диалог по ID' })
    @ApiParam({ name: 'id', description: 'ID краткого диалога' })
    @ApiResponse({ status: 200, description: 'Краткий диалог', type: DialogShortDto })
    findOneShortDialog(@Param('id') id: string) {
        return this.dialogService.findOneShort(id)
    }

    @Get('by-user/:userId')
    @ApiOperation({ summary: 'Получить краткие диалоги пользователя' })
    @ApiParam({ name: 'userId', description: 'ID пользователя' })
    @ApiResponse({ status: 200, description: 'Список кратких диалогов пользователя', type: [DialogShortDto] })
    findByUserShortDialog(@Param('userId') userId: number) {
        return this.dialogService.findShortByUser(userId)
    }
}
