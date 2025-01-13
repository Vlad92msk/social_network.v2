// modules/baseModule.ts
import { Injectable } from '../decorators'
import { ServiceContainer } from './container'
import { Logger } from './logger'
import { IModule } from '../types/module'

@Injectable()
export abstract class BaseModule implements IModule {
  constructor(
    protected container: ServiceContainer,
    protected logger: Logger,
  ) {}

  abstract get name(): string;

  abstract initialize(): Promise<void>;

  abstract destroy(): Promise<void>;
}
