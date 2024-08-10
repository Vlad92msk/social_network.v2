import { Injectable } from '@nestjs/common';

@Injectable()
export class CommentService {
    constructor() {}

    async getUserByEmail() {
        return 'Ok';
    }
}
