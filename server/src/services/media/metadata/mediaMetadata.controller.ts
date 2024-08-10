import { Controller, Get } from '@nestjs/common';

@Controller('media/metadata')
export class MediaMetadataController {
    constructor() {}

    @Get()
    async getUserByEmail() {
        return 'Ok'
    }
}
