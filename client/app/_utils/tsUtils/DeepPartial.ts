/**
 * Делает глубоковложенные свойства объекта необязательными
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
