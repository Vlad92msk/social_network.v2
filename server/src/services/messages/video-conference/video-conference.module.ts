import { Module, forwardRef } from '@nestjs/common'
import { VideoConferenceService } from './video-conference.service'
import { VideoConferenceGateway } from './video-conference.gateway'
import { DialogModule } from '../dialog/dialog.module'

@Module({
    imports: [forwardRef(() => DialogModule)],
    providers: [VideoConferenceService, VideoConferenceGateway],
    exports: [VideoConferenceService],
})
export class VideoConferenceModule {}
