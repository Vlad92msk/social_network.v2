/**
 * Извлекает тип результата из Promise
 * @example GetResultFromPromise<ReturnType<typeof getContactsQuery>>
 */
export type GetResultFromPromise<T extends Promise<unknown>> = T extends Promise<infer R> ? R : never;
