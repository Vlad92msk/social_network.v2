import { Session } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export type MiddlewareFunction = (
  request: NextRequest,
  response: NextResponse | null,
  session: Session | null
) => Promise<NextResponse | null>

export async function runMiddleware(
  request: NextRequest,
  middlewares: MiddlewareFunction[],
  session: Session | null
): Promise<NextResponse | null> {
  let response: NextResponse | null = null

  for (const middleware of middlewares) {
    console.log(`Executing middleware: ${middleware.name}`);
    response = await middleware(request, response, session)
    if (response instanceof NextResponse) {
      return response
    }
  }

  return response
}
