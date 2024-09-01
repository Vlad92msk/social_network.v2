import { forIn, pick, size } from "lodash";

export const updateEntityParams = <T extends Record<string, any>, K extends keyof T>(
    entity: T,
    params: Partial<T>,
    keys: K[]
): void => {
    const updateParams = pick(params, keys)

    if (size(updateParams)) {
        forIn(updateParams, (value, key) => {
            if (value !== undefined) {
                entity[key as K] = value
            }
        })
    }
};
