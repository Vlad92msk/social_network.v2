import { CreateMediaMetadataDto } from './create-media-metadata.dto'
import { PartialType } from '@nestjs/mapped-types'
import { ApiExtraModels } from '@nestjs/swagger'

@ApiExtraModels(CreateMediaMetadataDto)
export class UpdateMediaMetadataDto extends PartialType(CreateMediaMetadataDto) {}
