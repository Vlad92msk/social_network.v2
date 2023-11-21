import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import mainConfig from '@config/main.config'
import baseOrmConfig from '@config/orm.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [mainConfig, baseOrmConfig],
      isGlobal: true,
      envFilePath: '../.env',
    }),
  ],
})
export class AppModule {
}
