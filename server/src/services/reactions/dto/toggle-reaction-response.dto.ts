import { ApiProperty } from '@nestjs/swagger'


export class CalculateReactionsResponse {
  @ApiProperty({ description: 'Количество каждого типа реакции', example: { like: 5, heart: 3 } })
  counts: Record<string, number>

  @ApiProperty({ description: 'Реакция текущего пользователя', example: 'like', nullable: true })
  my_reaction: string | null
}
