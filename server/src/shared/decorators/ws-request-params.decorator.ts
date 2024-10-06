import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { RequestParams } from './request-params.decorator'
import { Socket } from 'socket.io'

export const WsRequestParams = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestParams => {
    const client = ctx.switchToWs().getClient<Socket>()
    return {
      profile_id: client.data.profile_id,
      user_info_id: client.data.user_info_id,
      user_public_id: client.data.user_public_id,
      headers: client.handshake.headers,
      body: ctx.switchToWs().getData(),
    }
  },
)
