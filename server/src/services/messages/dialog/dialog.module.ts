import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DialogService } from './dialog.service'
import { DialogController } from './dialog.controller'

@Module({
    imports: [TypeOrmModule.forFeature()],
    providers: [DialogService],
    controllers: [DialogController],
})
export class DialogModule {}
