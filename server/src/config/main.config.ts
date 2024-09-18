// main.config.ts
import { registerAs } from '@nestjs/config'
import { ConfigEnum } from '@config/config.enum'
import * as path from 'path'

export default registerAs(ConfigEnum.MAIN, () => ({
  host: process.env.API_HOST,
  port: process.env.API_PORT,
  client_host: process.env.API_CLIENT_HOST,
  client_port: process.env.API_CLIENT_PORT,
  uploadDir: path.join(__dirname, '..', '..', '..', '..', 'uploads'),
  swaggerDir: path.join(__dirname, '..', '..', '..', '..', 'swagger'),
  maxUserStorage: 1024 * 1024 * 1024, // 1GB
}))
