import { isNil } from "lodash";

export interface PaginationInfo {
    total: number
    pages: number
    page: number
    per_page: number
}

/**
 * Устанавливаем заголовки для запросов с пагинацией
 * @param paginationInfo
 */
export const createPaginationHeaders = (paginationInfo: Partial<PaginationInfo>): Record<string, string> => {
    const headers: Record<string, string> = {};

    if (!isNil(paginationInfo.total)) {
        headers['X-Total-Count'] = paginationInfo.total.toString();
    }
    if (!isNil(paginationInfo.pages)) {
        headers['X-Total-Pages'] = paginationInfo.pages.toString();
    }
    if (!isNil(paginationInfo.page)) {
        headers['X-Current-Page'] = paginationInfo.page.toString();
    }
    if (!isNil(paginationInfo.per_page)) {
        headers['X-Per-Page'] = paginationInfo.per_page.toString();
    }

    return headers;
};
