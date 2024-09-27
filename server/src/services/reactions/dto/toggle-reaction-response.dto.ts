import { ApiProperty } from '@nestjs/swagger'

import { CalculateReactions } from '@services/reactions/reactions.service'
import { IsString } from 'class-validator'

export class CalculateReactionsResponse implements CalculateReactions {
  @ApiProperty({ description: 'Реакция которую поставил текущий пользователь', type: String, nullable: true })
  @IsString()
  my_reaction: string | null
  [key: string]: string | number;
}
