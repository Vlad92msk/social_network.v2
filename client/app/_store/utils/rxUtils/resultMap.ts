import { Observable, OperatorFunction, pipe } from 'rxjs'
import { switchMap } from 'rxjs/operators'
import { FlatResponse, flatResponse, getResponse, GetResponse } from '../other'

interface ResultMapUtils {
  getResponse: GetResponse;
  flatResponse: FlatResponse;
}

type SuccessFunction<T> = (value: T, util: ResultMapUtils) => Observable<any>;

// type ErrorsArray = (Action | ActionCreator<PayloadApiError> | ReturnType<ActionCreator>)[];

// type ErrorsFunctionArray = (error: PayloadApiError) => ErrorsArray;

/**
 * errors - может быть массив экшенов
 * errors - может быть функцией, которая возвращает массив экшенов
 */
// export type ResultMapError = ErrorsArray | ErrorsFunctionArray;

/**
 * Утилита обрабатывающая success и errors
 * @param success - в этой функции обрабатывается успешный экшн и передающая утилиты для работы с response
 * @param errors - массив экшенов с ошибками | функция которая передает объект с ошибкой и возвращает массив экшенов
 */
export const resultMap = <T>({
  success,
  errors,
}: {
  success: SuccessFunction<T>;
  errors: any[];
}): OperatorFunction<T, any> =>
  pipe(
    switchMap((value) => success(value, { getResponse, flatResponse })),
    // catchError(errors),
  );
