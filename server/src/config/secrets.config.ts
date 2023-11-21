import { registerAs } from '@nestjs/config'
import { ConfigEnum } from '@config/config.enum'

export default registerAs(ConfigEnum.SECRET_KEY, () => ({
  jwt: process.env.JWT_SECRET_KEY,
}))
