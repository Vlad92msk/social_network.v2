import { Injectable } from '@nestjs/common'
import { WsException } from '@nestjs/websockets'
import { Socket } from 'socket.io'

@Injectable()
export class WebsocketDevMiddleware {
    async resolve(socket: Socket, next: (err?: Error) => void) {
        try {
            const { profile_id, user_info_id } = socket.handshake.auth

            if (!profile_id || !user_info_id) {
                throw new WsException('profile_id and user_info_id are required')
            }

            socket.data.user = {
                profile_id: Number(profile_id),
                user_info_id: Number(user_info_id)
            }

            next()
        } catch (error) {
            next(error)
        }
    }
}
