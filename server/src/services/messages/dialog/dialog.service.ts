import { Injectable } from '@nestjs/common';

@Injectable()
export class DialogService {
    constructor() {}

    async getUserByEmail() {
        return 'Ok';
    }
}
