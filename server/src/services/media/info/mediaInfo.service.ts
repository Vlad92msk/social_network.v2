import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaInfoService {
    constructor() {}

    async getUserByEmail() {
        return 'Ok';
    }
}
