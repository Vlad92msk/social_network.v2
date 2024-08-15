/**
 * Подгружает все сущности
 * @param database
 */
export const loadEntities = (database) =>
    (Object.keys(database) as Array<keyof typeof database>)
    .map((entity: keyof typeof database) => (
        database[entity]
    ))
