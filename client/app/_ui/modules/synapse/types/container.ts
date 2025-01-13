// types/container.ts
export interface Type<T = any> {
  new (...args: any[]): T;
}

export type ServiceIdentifier = string | Symbol | Type;

export interface ServiceMetadata {
  id: ServiceIdentifier;
  dependencies: ServiceIdentifier[];
  singleton?: boolean;
  tags?: string[];
}

export type ServiceFactory<T = any> = (...args: any[]) => T;

export interface GlobalMiddleware {
  before?: (serviceId: ServiceIdentifier, ...args: any[]) => any[];
  after?: (serviceId: ServiceIdentifier, result: any) => any;
}
