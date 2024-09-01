import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AbstractStorageService } from './abstract-storage.service'
import { LocalStorageService } from './local-storage.service'

@Module({
    imports: [ConfigModule],
    providers: [
        {
            // Это токен, который используется для идентификации зависимости.
            // В данном случае, это абстрактный класс AbstractStorageService.
            // Когда другие части приложения запрашивают AbstractStorageService,
            // NestJS будет использовать этот токен для определения, что именно нужно внедрить.
            provide: AbstractStorageService,
            // Это указывает NestJS, какой конкретный класс нужно использовать для создания экземпляра,
            // когда запрашивается AbstractStorageService
            useClass: LocalStorageService,
        },
    ],
    exports: [AbstractStorageService],
})
export class MediaStorageModule {}

// Если в будущем вы решите использовать облачное хранилище:
// @Module({
//     imports: [ConfigModule],
//     providers: [
//         {
//             provide: AbstractStorageService,
//             useClass: CloudStorageService, // Просто меняем эту строку
//         },
//     ],
//     exports: [AbstractStorageService],
// })
// export class MediaStorageModule {}

// Таким образом, все сервисы, которые используют AbstractStorageService, продолжат работать без изменений,
// но теперь они будут использовать облачное хранилище вместо локального.
// Этот подход особенно полезен в крупных приложениях, где гибкость и масштабируемость являются ключевыми факторами.
// Он позволяет легко адаптировать приложение к изменяющимся требованиям без необходимости переписывать большие части кода.
