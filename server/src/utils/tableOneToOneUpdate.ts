import { forIn, set } from 'lodash'
import { BaseEntity } from 'typeorm'

/**
 * Обновляет данные в таблице со связью Один к Одному
 */
export const tableOneToOneUpdate = async <T extends BaseEntity>(newParams: Record<string, any>, entity: T): Promise<T> => {
  forIn(newParams, (value, key) => forIn(value, (v, p) => set(entity[key], p, v)))
  return await entity.save()
}
