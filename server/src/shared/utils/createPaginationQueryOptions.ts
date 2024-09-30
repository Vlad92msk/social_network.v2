import { SortDirection } from '@shared/types'
import { DEFAULT_PAGE, DEFAULT_PER_PAGE } from '@utils/createPaginationResponse'
import { isEmpty, merge } from 'lodash'
import { FindOneOptions } from 'typeorm'

interface CreatePaginationQueryOptions<Entity> {
    query: any
    options?: FindOneOptions<Entity>
}

function removeEmptyValues(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(removeEmptyValues).filter(v => v !== undefined)
    } else if (obj !== null && typeof obj === 'object') {
        const result = Object.fromEntries(
          Object.entries(obj)
            .map(([k, v]) => [k, removeEmptyValues(v)])
            .filter(([_, v]) => v !== undefined && v !== null && (typeof v !== 'object' || Object.keys(v).length > 0))
        )
        return Object.keys(result).length > 0 ? result : undefined
    }
    return obj === null || obj === undefined ? undefined : obj
}

export function createPaginationQueryOptions<Entity>(props: CreatePaginationQueryOptions<Entity>) {
    const { query, options = {} } = props
    const { page = DEFAULT_PAGE, per_page = DEFAULT_PER_PAGE, sort_by, sort_direction, ...searchParams } = query

    const queryOptions: any = {
        skip: (page - 1) * per_page,
        take: per_page,
    }

    const cleanSearchParams = removeEmptyValues(searchParams)
    if (!isEmpty(cleanSearchParams)) {
        queryOptions.where = cleanSearchParams
    }

    if (sort_by) {
        queryOptions.order = { [sort_by]: sort_direction }
    }

    const cleanOptions = removeEmptyValues(options)

    if (cleanOptions?.where) {
        queryOptions.where = queryOptions.where
          ? removeEmptyValues({ ...queryOptions.where, ...cleanOptions.where })
          : cleanOptions.where
    }
    return merge({}, queryOptions, cleanOptions)
}

interface CreatePaginationAndOrderProps {
    page: number
    per_page: number
    sort_by: string
    sort_direction?: string
}

interface CreatePaginationAndOrderResponse {
    skip: number
    take: number
    order: any
}
export function createPaginationAndOrder(props: CreatePaginationAndOrderProps): CreatePaginationAndOrderResponse {
    const {
        page = DEFAULT_PAGE,
        per_page = DEFAULT_PER_PAGE,
        sort_direction = SortDirection.ASC,
        sort_by,
    } = props

    const queryOptions: any = {
        skip: (page - 1) * per_page,
        take: per_page,
    }

    if (sort_by) {
        queryOptions.order = { [sort_by]: sort_direction }
    }

    return queryOptions
}
