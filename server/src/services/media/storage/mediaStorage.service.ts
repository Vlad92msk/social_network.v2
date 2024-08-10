import { Injectable } from '@nestjs/common';

@Injectable()
export class MediaStorageService {
    constructor() {}

    async getUserByEmail() {
        return 'OK';
    }
}
