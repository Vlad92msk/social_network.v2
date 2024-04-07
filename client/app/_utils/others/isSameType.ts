/**
 * Точная проверка на то что типы обоих сущностей равны
 * @param value1
 * @param value2
 */
export const isSameType = (value1, value2) => (
  Object.prototype.toString.call(value1) === Object.prototype.toString.call(value2)
)
