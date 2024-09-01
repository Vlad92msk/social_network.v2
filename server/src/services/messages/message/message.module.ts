import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MessageEntity } from './entity/message.entity'

@Module({
    imports: [TypeOrmModule.forFeature([MessageEntity])],
})
export class MessageModule {}
