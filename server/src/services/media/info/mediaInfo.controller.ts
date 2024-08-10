import { Controller, Get } from '@nestjs/common';

@Controller('media/info')
export class MediaInfoController {
    constructor() {}

    @Get()
    async getUserByEmail() {
        return 'Ok'
    }
}
