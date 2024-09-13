import { Action } from 'redux';
import { catchError } from 'rxjs/operators';
import { PayloadApiError } from '../../types/request'
import { ofCompact } from './ofCompact'
import { ActionCreator } from './ofType'

type ErrorsArray = (Action | ActionCreator<PayloadApiError> | ReturnType<ActionCreator>)[];

type ErrorsFunctionArray = (error: DefaultError) => ErrorsArray;

export type DefaultError = {
  code?: number;
  message?: string;
  description?: string;
};

/**
 * errors - может быть массив экшенов
 * errors - может быть функцией, которая возвращает массив экшенов
 */
export type ResultMapError = ErrorsArray | ErrorsFunctionArray;

/**
 * @description Observable catchError для обработки ошибки метода
 * @param actions - Экшен или набор экшенов которые будут вызваны если метод отработал с ошибкой, с передачей в них полученной ошибки
 */
export const catchErrorApi = (actions: ResultMapError): ReturnType<typeof catchError> =>
  catchError((error: any) => {
    let arrActions: ErrorsArray;

    if (typeof actions === 'function') {
      arrActions = actions(error);
    } else if (Array.isArray(actions)) {
      arrActions = actions;
    } else {
      // Если actions не функция и не массив, создаем пустой массив
      arrActions = [];
    }

    // Убедимся, что arrActions - массив
    if (!Array.isArray(arrActions)) {
      arrActions = [];
    }

    return ofCompact(...arrActions
      .filter(Boolean)
      .map((action) =>
        typeof action === 'function'
          ? action({ error })
          : action
      )
    );
  });
