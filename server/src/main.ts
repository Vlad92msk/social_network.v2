// main.ts
import { config } from 'dotenv'
config()

if (process.env.NODE_ENV === 'development') {
  require('module-alias/register')
}

import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import * as cookieParser from 'cookie-parser'
import { ConfigEnum } from '@config/config.enum'
import { AppModule } from '@src/services/app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.use(cookieParser())
  app.enableCors()

  const config = await app.get(ConfigService)
  const port = Number(config.get(`${ConfigEnum.MAIN}.port`))

  const host = String(config.get(`${ConfigEnum.MAIN}.host`))

  await app.listen(port, () => {
    console.log(`Сервер доступен - http://${host}:${port}`)
  })
}

bootstrap()
