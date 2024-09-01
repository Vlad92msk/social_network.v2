import { createParamDecorator, ExecutionContext } from '@nestjs/common'

/**
 * Параметры, которые передаются через cookie для запроса
 */
export interface RequestParams {
    profile_id: number
    user_info_id: number
}

export const RequestParams = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): RequestParams => {
        const request = ctx.switchToHttp().getRequest()
        return {
            profile_id: Number(request.cookies['profile_id']),
            user_info_id: Number(request.cookies['user_info_id']),
        }
    },
)

