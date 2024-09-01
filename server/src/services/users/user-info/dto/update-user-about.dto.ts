import { IntersectionType, OmitType, PartialType } from '@nestjs/mapped-types'
import { UserAbout } from '../entities'


export class UpdateUserAboutDto extends IntersectionType(
    OmitType(PartialType(UserAbout, { skipNullProperties: true }), ['id', 'banner_image']),
)  {

}
