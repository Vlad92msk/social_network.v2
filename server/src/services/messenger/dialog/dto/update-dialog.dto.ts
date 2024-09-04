// update-dialog.dto.ts
import { PartialType } from '@nestjs/mapped-types'
import { CreateDialogDto } from './create-dialog.dto'


export class UpdateDialogDto extends PartialType(CreateDialogDto) {}
