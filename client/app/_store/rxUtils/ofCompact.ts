import { of } from 'rxjs';

/**
 * Фильтрует переданные аргументы в of
 */
export const ofCompact: typeof of = (...args: []) => of(...args.filter(Boolean));
