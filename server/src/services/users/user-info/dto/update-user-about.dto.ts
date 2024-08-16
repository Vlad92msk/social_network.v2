import { IntersectionType, PartialType, OmitType } from "@nestjs/mapped-types";
import { UserAbout, UserInfo } from "@services/users/user-info/entities";


export class UpdateUserAboutDto extends IntersectionType(
    OmitType(PartialType(UserAbout, { skipNullProperties: true }), ['id', 'banner_image']),
)  {

}
