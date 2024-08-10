import { Controller, Get, Param } from '@nestjs/common';

@Controller('api/messages/dialogs')
export class DialogController {
    constructor() {}

    @Get()
    async getUserByEmail(){
        return 'ok'
    }
}
