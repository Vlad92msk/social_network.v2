import { Injectable } from '@nestjs/common';

@Injectable()
export class PostService {
    constructor() {}

    async getUserByEmail() {
        return 'ok'
    }
}
