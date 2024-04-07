/**
 * Пустое/несуществующее значение
 */
export const isNil = (value) => (
  value === null || typeof value === 'undefined'
)
