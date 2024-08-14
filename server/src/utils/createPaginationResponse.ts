import { defaultTo } from "lodash";
import { PaginationInfo } from "./createPaginationHeaders";

export interface PaginationResponse<Data> extends PaginationInfo {
    data: Data
}
interface PaginationResponsePayload<Data> extends Pick<PaginationInfo, 'per_page' | 'total' | 'page'> {
    data: Data
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PER_PAGE = 50;

export const createPaginationResponse = <Data>(paginationInfo: PaginationResponsePayload<Data>): PaginationResponse<Data> => {
    const total = defaultTo(paginationInfo.total, 0);
    const page = defaultTo(paginationInfo.page, DEFAULT_PAGE);
    const per_page = defaultTo(paginationInfo.per_page, DEFAULT_PER_PAGE);
    const pages = Math.max(1, Math.ceil(total / per_page));

    return {
        data: paginationInfo.data,
        total,
        page,
        per_page,
        pages,
    };
};
