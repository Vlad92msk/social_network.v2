import { Module, forwardRef } from '@nestjs/common'
import { UserInfoModule } from '@services/users/user-info/user-info.module'
import { ConferenceService } from './conference.service'
import { ConferenceGateway } from './conference.gateway'
import { DialogModule } from '../dialog/dialog.module'

@Module({
    imports: [
      forwardRef(() => DialogModule),
        forwardRef(() => UserInfoModule),
    ],
    providers: [ConferenceService, ConferenceGateway],
    exports: [ConferenceService],
})
export class ConferenceModule {}
