import { clone, setWith } from 'lodash'

/**
 * Обычный Лодаш сет - мутирует объект
 * Эта же функция проводит изменения имутабельно
 */
export function setImmutable<S extends Record<string, any>>(state: S, path: string, value: unknown): S {
  return setWith<S>(clone(state), path, value, clone)
}
