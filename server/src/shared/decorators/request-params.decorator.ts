import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common'

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
      const profile_id = request.cookies['profile_id']
      const user_info_id = request.cookies['user_info_id']

      if (!profile_id || !user_info_id) {
        throw new BadRequestException('Отсутствуют требуемые файлы cookie. Убедитесь, что вы установили учетные данные: "include" в конфигурации API.')
      }

      return {
        profile_id: Number(profile_id),
        user_info_id: Number(user_info_id),
        headers: request.headers,
        body: request.body
      }
    },
)

