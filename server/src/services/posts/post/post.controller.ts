import { Controller, Get, Param } from '@nestjs/common';

@Controller('api/posts')
export class PostController {
    constructor() {}

    @Get()
    async getUserByEmail() {
        return 'ok'
    }
}
