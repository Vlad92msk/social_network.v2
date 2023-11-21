import { registerAs } from '@nestjs/config'
import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ConfigEnum } from '@config/config.enum'

export default registerAs(
  ConfigEnum.ORM,
  (): TypeOrmModuleOptions => ({
    // @ts-ignore
    type: process.env.TYPEORM_CONNECTION,
    database: process.env.TYPEORM_DATABASE,
    host: process.env.TYPEORM_HOST,
    username: process.env.TYPEORM_USERNAME,
    password: process.env.TYPEORM_PASSWORD,
    autoLoadEntities: true,
    synchronize: true,
    port: +process.env.TYPEORM_PORT,
    entities: [`${__dirname}/../lib/**/**/entities/*.entity{.ts,.js}`],
    // migrations: [`${__dirname}/migrations/**/**/*{.ts, .js}`],
    cli: {
      migrationsDir: 'src/migrations',
    },
  })
)
