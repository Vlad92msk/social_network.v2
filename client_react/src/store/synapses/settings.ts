import { loggerDispatcherMiddleware } from 'synapse-storage/reactive'

export const loggerMiddleware = loggerDispatcherMiddleware({
  collapsed: true,
})
