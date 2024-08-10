import { Controller, Get } from '@nestjs/common';

@Controller('media/storage')
export class MediaStorageController {
    constructor() {}

    @Get()
    async getUserByEmail() {
        return 'OK'
    }
}
