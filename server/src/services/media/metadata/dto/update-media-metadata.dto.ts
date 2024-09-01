import { CreateMediaMetadataDto } from './create-media-metadata.dto'
import { PartialType } from '@nestjs/mapped-types'

export class UpdateMediaMetadataDto extends PartialType(CreateMediaMetadataDto) {}
