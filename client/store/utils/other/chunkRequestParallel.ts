import { chunk } from 'lodash';
import { Observable, forkJoin, of } from 'rxjs';
import { concatAll, toArray } from 'rxjs/operators';
/**
 * Разбиение запроса на порции
 * Отправляется ПАРАЛЛЕЛЬНО n-запросов и дожидается ответа от каждого
 * @param fn - функция в которую передается chunk и возвращается функция api
 * @param arr - массив который нужно поделить
 * @param size - размер порции
 */
export const chunkRequestParallel = <T, R>(
  fn: (chunk: T[]) => Observable<R>,
  arr: T[],
  size: number,
): Observable<R[]> => forkJoin(chunk(arr, size).map(fn));
export type ChunkRequestParallel = typeof chunkRequestParallel;

/**
 * Разбиение запроса на порции
 * Отправляется ПОСЛЕДОВАТЕЛЬНО n-запросов и дожидается ответа от каждого
 * @param fn - функция в которую передается chunk и возвращается функция api
 * @param arr - массив который нужно поделить
 * @param size - размер порции
 */
export const chunkRequestConsistent = <T, R>(
  fn: (chunk: T[]) => Observable<R>,
  arr: T[],
  size: number,
): Observable<R[]> => {
  const chunks = chunk(arr, size).map(fn);
  return of(...chunks).pipe(concatAll(), toArray());
};
export type ChunkRequestConsistent = typeof chunkRequestConsistent;
