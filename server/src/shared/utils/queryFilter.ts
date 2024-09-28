import { FindOptionsWhere, Between, MoreThanOrEqual, LessThanOrEqual, IsNull } from 'typeorm'

type RangeValue = number | Date | null

export function addRangeFilter<Entity>(
  whereClause: FindOptionsWhere<Entity>,
  field: string & keyof Entity,
  min?: RangeValue,
  max?: RangeValue
) {
    if (min !== undefined && max !== undefined) {
        if (min === null && max === null) {
            whereClause[field] = IsNull() as any
        } else if (min === null) {
            whereClause[field] = LessThanOrEqual(max) as any
        } else if (max === null) {
            whereClause[field] = MoreThanOrEqual(min) as any
        } else {
            whereClause[field] = Between(min, max) as any
        }
    } else if (min !== undefined) {
        whereClause[field] = min === null ? IsNull() as any : MoreThanOrEqual(min) as any
    } else if (max !== undefined) {
        whereClause[field] = max === null ? IsNull() as any : LessThanOrEqual(max) as any
    }
}

export function addMultipleRangeFilters<Entity>(
  whereClause: FindOptionsWhere<Entity>,
  filters: Partial<Record<string & keyof Entity, { min?: RangeValue; max?: RangeValue }>>
) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    Object.entries(filters).forEach(([field, { min, max }]) => {
        addRangeFilter(whereClause, field as string & keyof Entity, min, max)
    })
}
