// decorators.ts
import 'reflect-metadata'

// Ключи для метаданных
const INJECTABLE_METADATA_KEY = Symbol('INJECTABLE_METADATA')
const INJECT_METADATA_KEY = Symbol('INJECT_METADATA')

// Декоратор для классов, которые можно внедрять
export function Injectable(): ClassDecorator {
  return (target: any) => {
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, true, target)
    return target
  }
}

// Декоратор для параметров, в которые нужно внедрить зависимости
export function Inject(token?: string | symbol | Function): ParameterDecorator {
  return (target: Object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    const existingInjections = Reflect.getMetadata(INJECT_METADATA_KEY, target) || []
    existingInjections[parameterIndex] = token
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjections, target)
  }
}
