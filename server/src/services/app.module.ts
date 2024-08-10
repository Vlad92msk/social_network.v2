import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import mainConfig from '@config/main.config'
import baseOrmConfig from '@config/orm.config'
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileModule } from "@src/services/profile/profile/profile.module";
import { UserModule } from "@src/services/users/user/user.module";

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
    ProfileModule,
    UserModule,
  ],
})
export class AppModule {
}


