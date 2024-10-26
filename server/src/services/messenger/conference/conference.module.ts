import { Module, forwardRef } from '@nestjs/common'
import { ConferenceService } from './conference.service'
import { ConferenceGateway } from './conference.gateway'
import { DialogModule } from '../dialog/dialog.module'

@Module({
    imports: [forwardRef(() => DialogModule)],
    providers: [ConferenceService, ConferenceGateway],
    exports: [ConferenceService],
})
export class ConferenceModule {}
