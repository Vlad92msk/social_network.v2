// types/DIContainer.ts
export interface Type<T = any> {
  new (...args: any[]): T;
}

export type ServiceIdentifier = string | Symbol | Type;

