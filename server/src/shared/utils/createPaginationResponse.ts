import { defaultTo } from "lodash";
import { PaginationInfo } from "./createPaginationHeaders";

export interface PaginationResponse<Data> {
    data: Data
    paginationInfo: PaginationInfo
}

interface PaginationResponsePayload<Data> {
    data: Data
    total: number
    query: Record<string, any>
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 50;

export const createPaginationResponse = <Data>(props: PaginationResponsePayload<Data>): PaginationResponse<Data> => {
    const { data, total = 0, query } = props
    const page: number = defaultTo(query.page, DEFAULT_PAGE);
    const per_page: number = defaultTo(query.per_page, DEFAULT_PER_PAGE);
    const pages: number = Math.max(1, Math.ceil(total / per_page));

    return {
        data,
        paginationInfo: {
            total,
            page,
            per_page,
            pages,
        }
    };
};
