import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm'

/**
 * Добавляет фильтр по диапазону значений в условия WHERE
 * @param whereClause - объект условий WHERE
 * @param field - поле для фильтрации
 * @param min - минимальное значение
 * @param max - максимальное значение
 */
export function addRangeFilter(whereClause: any, field: string, min?: number | Date, max?: number | Date) {
    if (min !== undefined && max !== undefined) {
        whereClause[field] = Between(min, max)
    } else if (min !== undefined) {
        whereClause[field] = MoreThanOrEqual(min)
    } else if (max !== undefined) {
        whereClause[field] = LessThanOrEqual(max)
    }
}

/**
 * Добавляет несколько фильтров по диапазону значений в условия WHERE
 * @param whereClause - объект условий WHERE
 * @param filters - объект с фильтрами, где ключ - имя поля, а значение - объект с min и max
 */
export function addMultipleRangeFilters(whereClause: any, filters: Record<string, { min?: number | Date, max?: number | Date }>) {
    Object.entries(filters).forEach(([field, { min, max }]) => {
        addRangeFilter(whereClause, field, min, max)
    })
}
