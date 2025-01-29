import { IEventBus } from '../../event-bus/event-bus.interface'
import { ILogger } from '../../logger/logger.interface'
import { IPluginExecutor } from '../modules/plugin-manager/plugin-managers.interface'

export class NoopPluginManager implements IPluginExecutor {
  executeBeforeGet(key: string): string { return key }

  executeAfterGet(key: string, value: any): any { return value }

  executeBeforeSet(key: string, value: any): any { return value }

  executeAfterSet(key: string, value: any): void {}

  executeBeforeDelete(key: string): boolean { return true }

  executeAfterDelete(key: string): void {}

  executeOnClear(): void {}
}

export class NoopEventBus implements Pick<IEventBus, 'emit' | 'subscribe'> {
  async emit(event) {}

  subscribe(){
    return () => {}
  }
}

export class ConsoleLogger implements Pick<ILogger, 'debug' | 'info' | 'error'> {
  debug(message: string, ...args: any[]): void {
    console.debug(message, ...args)
  }

  info(message: string, ...args: any[]): void {
    console.info(message, ...args)
  }

  error(message: string, ...args: any[]): void {
    console.error(message, ...args)
  }
}
