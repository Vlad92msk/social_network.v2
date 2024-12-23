import { Config, createStateSyncMiddleware } from 'redux-state-sync'

const config: Config = {
  // predicate: (action) => {
  //   // Проверяем только успешные API запросы
  //   if (!action.type.includes('API_') || !action.type.endsWith('/fulfilled')) {
  //     return false
  //   }
  //
  //   try {
  //     // Глубокая проверка всех свойств action на сериализуемость
  //     const isSerializable = (obj: any): boolean => {
  //       if (!obj || typeof obj !== 'object') {
  //         return true
  //       }
  //
  //       for (const key in obj) {
  //         const value = obj[key]
  //
  //         // Пропускаем undefined значения
  //         if (value === undefined) {
  //           return false
  //         }
  //
  //         // Проверяем функции и специальные объекты
  //         if (
  //           typeof value === 'function' ||
  //           value instanceof Error ||
  //           value instanceof Promise ||
  //           value instanceof WeakMap ||
  //           value instanceof WeakSet ||
  //           value instanceof Map ||
  //           value instanceof Set ||
  //           value instanceof Date
  //         ) {
  //           return false
  //         }
  //
  //         // Рекурсивно проверяем вложенные объекты
  //         if (typeof value === 'object' && !isSerializable(value)) {
  //           return false
  //         }
  //       }
  //
  //       return true
  //     }
  //
  //     return isSerializable(action)
  //   } catch (error) {
  //     return false
  //   }
  // },
  broadcastChannelOption: {
    type: 'native',
  },
  whitelist: ['API_media'],
  channel: 'social-network-sync',
}

export const stateSyncMiddleware = createStateSyncMiddleware(config)
