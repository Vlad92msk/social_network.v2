import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Параметры, которые передаются через cookie для запроса
 */
export interface RequestParams {
    profile_id: number
    user_info_id: number
    headers: any
  body: any
}

export const RequestParams = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): RequestParams => {
        const request = ctx.switchToHttp().getRequest()
      request.headers
        return {
            profile_id: Number(request.cookies['profile_id']),
            user_info_id: Number(request.cookies['user_info_id']),
          headers: request.headers,
          body: request.body
        }
    },
)

