export enum SortDirection {
    ASC = 'ASC',
    DESC = 'DESC'
}

export interface SortBy <T> {
    sort_by?: keyof T;
    sort_direction?: SortDirection;
}

/**
 * Постраничный вывод
 */
export interface Pagination {
    /**
     * Номер страницы
     * @format int32
     * @default 1
     */
    page?: number
    /**
     * Количество записей на страницы
     * @format int32
     * @default 50
     */
    per_page?: number
}

export interface ResponseWithPagination<T> {
    data: T
    pages: number
    count_elements: number
    current_page: number
    per_page: number
}
