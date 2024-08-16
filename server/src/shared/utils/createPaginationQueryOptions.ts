import { assign, isEmpty } from "lodash";
import { FindOneOptions } from "typeorm/find-options/FindOneOptions";


interface CreatePaginationQueryOptions<Entity> {
    query: any;
    options?: FindOneOptions<Entity>
}

export function createPaginationQueryOptions<Entity>(props: CreatePaginationQueryOptions<Entity>) {
    const { query, options = {} } = props;
    const { page, per_page, sort_by, sort_direction, ...searchParams } = query;

    const queryOptions: any = {
        skip: (page - 1) * per_page,
        take: per_page,
    };

    if (!isEmpty(searchParams)) {
        queryOptions.where = searchParams
    }

    if (sort_by) {
        queryOptions.order = { [sort_by]: sort_direction };
    }

    return assign(query, options);
}
