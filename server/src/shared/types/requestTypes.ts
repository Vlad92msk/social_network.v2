import { RequestParams } from '@shared/decorators'
import { Socket } from 'socket.io'

export enum SortDirection {
    ASC = 'ASC',
    DESC = 'DESC'
}

export interface AuthenticatedSocket<Data = unknown> extends Socket {
    requestParams: RequestParams;
    data: Data;
}
