import { Body, Controller, Get, Param, Post, Sse } from '@nestjs/common'
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger'
import { RequestParams } from '@shared/decorators'
import { Observable } from 'rxjs'
import { CreateReactionDto } from './dto/create-reaction.dto'
import { CalculateReactionsResponse } from './dto/toggle-reaction-response.dto'
import { ReactionsService, ReactionTarget } from './reactions.service'

@ApiTags('Реакции')
@Controller('api/reactions')
export class ReactionController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post(':entity_type/:entity_id')
  @ApiOperation({ summary: 'Установить/сменить реакцию' })
  @ApiParam({ name: 'entity_type', type: () => ReactionTarget, description: 'Тип сущности к которой устанавливается реакция', enum: ReactionTarget, required: true, example: ReactionTarget })
  @ApiParam({ name: 'entity_id', type: String, description: 'ID сущности к которой устанавливается реакция', required: true })
  @ApiCreatedResponse({ description: 'Реакция успешно установлена', type: () => CalculateReactionsResponse })
  @ApiBadRequestResponse({ description: 'Переданы неверные данные' })
  create(
    @Param('entity_type') entityType: ReactionTarget,
    @Param('entity_id') entityId: string,
    @Body() createReactionDto: CreateReactionDto,
    @RequestParams() params: RequestParams
  ) {
    return this.reactionsService.toggle(createReactionDto, entityType, entityId, params)
  }

  @Get('get/:entity_type/:entity_id')
  @ApiOperation({ summary: 'Получить реакции к сущности' })
  @ApiParam({ name: 'entity_type', type: () => ReactionTarget, description: 'Тип сущности к которой устанавливается реакция', enum: ReactionTarget, required: true, example: ReactionTarget })
  @ApiParam({ name: 'entity_id', type: String, description: 'ID сущности к которой устанавливается реакция', required: true })
  @ApiCreatedResponse({ description: 'Реакция успешно установлена', type: () => CalculateReactionsResponse })
  @ApiBadRequestResponse({ description: 'Переданы неверные данные' })
  async getReactions(
    @Param('entity_type') entityType: ReactionTarget,
    @Param('entity_id') entityId: string,
    @RequestParams() params: RequestParams
  ) {
    const reactions = await this.reactionsService.getReactions(entityType, entityId, params)

    return reactions
  }

  @Sse('updates/:entity_type/:entity_id')
  reactionUpdates(
    @Param('entity_type') entityType: ReactionTarget,
    @Param('entity_id') entityId: string,
    @RequestParams() params: RequestParams
  ): Observable<MessageEvent> {
    return this.reactionsService.getReactionUpdates(entityType, entityId, params)
  }
}
