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
import * as YAML from 'yaml'
import * as fs from 'fs'
import * as path from 'path'
import { setupSwagger } from '../swagger.config'
import { PostModule } from '@services/posts/post/post.module'
import { TagModule } from '@services/tags/tags.module'



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

  let swaggerConsile: any[]

  // Настройка Swagger только в режиме разработки
  if (process.env.NODE_ENV === 'development') {
    swaggerConsile = setupSwagger(
        app,
        { host, port },
        [
          {
            module: PostModule,
            url: 'posts',
            name: 'Посты',
            title: 'Посты API',
            description: 'API операций с постами',
            tag: 'Посты',
            version: '1.0'
          },
          {
            module: TagModule,
            url: 'tags',
            name: 'Теги',
            title: 'Теги API',
            description: 'API операций с тегами',
            tag: 'Теги',
            version: '1.0'
          }
        ]
    )
  }

  await app.listen(port, async () => {
    console.log(`Сервер доступен - http://${host}:${port}`)
    console.group('swagger')
    swaggerConsile.forEach((s) => console.log(s))
    console.groupEnd()
  })
}

bootstrap()
