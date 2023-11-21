import { config } from 'dotenv'
import { DataSource } from 'typeorm'

config()

export default new DataSource({
  // @ts-ignore
  type: process.env.TYPEORM_CONNECTION,
  database: process.env.TYPEORM_DATABASE,
  host: process.env.TYPEORM_HOST,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  autoLoadEntities: true,
  synchronize: false,
  entities: [`${__dirname}/../lib/**/**/entities/*.entity{.ts,.js}`],
  migrations: [`${__dirname}/migrations/*{.ts, .js}`],
  cli: {
    migrationsDir: 'src/migrations',
  },
})
