import { Socket } from 'socket.io'
import { RequestParams } from '@shared/decorators'
import { ClientToServerEvents } from './client-to-server-events'
import { ServerToClientEvents } from './server-to-client-events'

export interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents, {}, RequestParams> {
    requestParams: RequestParams
}
