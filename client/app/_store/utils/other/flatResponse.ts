import { flatMap } from 'lodash';

/**
 * Утилита формирующая по ключу плоский массив из данных response
 */
export const flatResponse = <T extends Record<string, any>, PROP_NAME extends keyof T>(arr: T[], prop: PROP_NAME): T[PROP_NAME] =>
    flatMap(arr, prop as string) as T[PROP_NAME];
export type FlatResponse = typeof flatResponse;
