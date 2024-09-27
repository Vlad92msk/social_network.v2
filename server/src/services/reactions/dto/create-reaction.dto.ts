import { ApiProperty } from '@nestjs/swagger'
import { IsNotEmpty, IsString } from 'class-validator'

export class CreateReactionDto {
  @ApiProperty({ description: 'Название', required: false, type: String })
  @IsString()
  @IsNotEmpty()
  name: string
}
