import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import mainConfig from '@config/main.config'
import baseOrmConfig from '@config/orm.config'
import { UserProfileModule } from "@lib/profile/user/user.module";
import { TypeOrmModule } from "@nestjs/typeorm";

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [mainConfig, baseOrmConfig],
      isGlobal: true,
      envFilePath: '../.env',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: baseOrmConfig,
    }),
    UserProfileModule,
  ],
})
export class AppModule {
}
