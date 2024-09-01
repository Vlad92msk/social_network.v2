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
import { NestExpressApplication } from '@nestjs/platform-express'
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.use(cookieParser())
  app.enableCors()

  const config = await app.get(ConfigService)
  const port = Number(config.get(`${ConfigEnum.MAIN}.port`))

  const host = String(config.get(`${ConfigEnum.MAIN}.host`))
  const uploadPath = String(config.get(`${ConfigEnum.MAIN}.uploadDir`))


// Настройка статической директории для uploads
  app.useStaticAssets(uploadPath, {
    prefix: '/uploads/',
  })

  await app.listen(port, () => {
    console.log(`Сервер доступен - http://${host}:${port}`)
  })
}

bootstrap()
