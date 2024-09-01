import { Controller, Get } from '@nestjs/common'

@Controller('comments')
export class CommentController {
    constructor() {}

    @Get()
    async getUserByEmail() {
        return 'Ok'
    }
}
