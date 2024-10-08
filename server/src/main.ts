import { ReactionsModule } from '@services/reactions/reactions.module'
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
import { setupSwagger } from '../swagger.config'
import { PostModule } from '@services/posts/post/post.module'
import { TagModule } from '@services/tags/tags.module'
import { UserInfoModule } from '@services/users/user-info/user-info.module'
import { ProfileModule } from '@services/profile/profile/profile.module'
import { MediaInfoModule } from '@services/media/info/media-info.module'
import { MessageModule } from '@services/messenger/message/message.module'
import { CommentModule } from '@services/comments/comment/comment.module'
import { DialogModule } from '@services/messenger/dialog/dialog.module'



async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)


  app.useGlobalPipes(new ValidationPipe({ transform: true }))
  app.use(cookieParser())

  const config = await app.get(ConfigService)
  const uploadPath = String(config.get(`${ConfigEnum.MAIN}.uploadDir`))

  const server_port = Number(config.get(`${ConfigEnum.MAIN}.port`))
  const server_host = String(config.get(`${ConfigEnum.MAIN}.host`))

  const client_port = Number(config.get(`${ConfigEnum.MAIN}.client_port`))
  const client_host = String(config.get(`${ConfigEnum.MAIN}.client_host`))

  app.enableCors({
    origin: `http://${client_host}:${client_port}`, // URL фронтенд-приложения
    credentials: true,
  })

  // Настройка статической директории для uploads
  app.useStaticAssets(uploadPath, {
    prefix: '/uploads/',
  })

  let swaggerConsile: any[]

  // Настройка Swagger только в режиме разработки
  if (process.env.NODE_ENV === 'development') {
    swaggerConsile = await setupSwagger(
        app,
        {
            directory: String(config.get(`${ConfigEnum.MAIN}.swaggerDir`)),
            host: server_host,
            port: server_port,
        },
        [
          {
            module: PostModule,
            url: 'posts',
            name: 'Посты',
            description: 'API операций с постами',
            version: '1.0'
          },
          {
            module: UserInfoModule,
            url: 'userInfo',
            name: 'Пользователи',
            description: 'API операций с gолзователями',
            version: '1.0'
          },
          {
            module: ProfileModule,
            url: 'profile',
            name: 'Профили',
            description: 'API операций с профилями',
            version: '1.0'
          },
          {
            module: TagModule,
            url: 'tags',
            name: 'Теги',
            description: 'API операций с тегами',
            version: '1.0'
          },
          {
            module: MediaInfoModule,
            url: 'media',
            name: 'Медиа',
            description: 'API операций с медиа',
            version: '1.0'
          },
          {
            module: MessageModule,
            url: 'messages',
            name: 'Сообщения',
            description: 'API операций с сообщениями',
            version: '1.0'
          },
          {
            module: CommentModule,
            url: 'comments',
            name: 'Комментарии',
            description: 'API операций с комментариями',
            version: '1.0'
          },
            {
            module: DialogModule,
            url: 'dialogs',
            name: 'Диалоги',
            description: 'API операций с диалогами (чатами)',
            version: '1.0'
          },
          {
            module: ReactionsModule,
            url: 'reactions',
            name: 'Реакции',
            description: 'API операций с реакциями',
            version: '1.0'
          },
        ]
    )
  }

  await app.listen(server_port, async () => {
    console.log(`Сервер доступен - http://${server_host}:${server_port}`)
    console.group('swagger')
    swaggerConsile.forEach((s) => console.log(s))
    console.groupEnd()
  })
}

bootstrap()
