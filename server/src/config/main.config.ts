// main.config.ts
import { registerAs } from '@nestjs/config'
import { ConfigEnum } from '@config/config.enum'
import * as path from 'path';

export default registerAs(ConfigEnum.MAIN, () => ({
  host: process.env.API_HOST,
  port: process.env.API_PORT,
  uploadDir: path.join(__dirname, '..', '..', '..', '..', 'uploads'),
  maxUserStorage: 1024 * 1024 * 1024, // 1GB
}))
