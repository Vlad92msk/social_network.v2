import { ofType as ofTypePac } from 'redux-observable';
import { OperatorFunction } from 'rxjs';
import { ActionCreatorWithOptionalPayload } from "@reduxjs/toolkit";

export type ActionCreator<P = any> = ActionCreatorWithOptionalPayload<P>;

/**
 * @description Типизированный ofType, возвращает payload с типом от первого ActionCreator или напрямую переданного P
 * @param {ActionCreator} actions - Экшен или набор экшенов которые вызывают эффект
 */
declare type FnOfType = <P extends ReturnType<A>, A extends ActionCreator = ActionCreator>(
  ...actions: [A, ...(A | ActionCreator)[]]
) => OperatorFunction<A, P>;
export const ofTypeEffect = ofTypePac as FnOfType;
