import { registerAs } from '@nestjs/config'
import { ConfigEnum } from '@config/config.enum'

export default registerAs(ConfigEnum.MAIN, () => ({
  host: process.env.API_HOST,
  port: process.env.API_PORT,
}))
