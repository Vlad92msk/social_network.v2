import { ClassNameList, withNaming } from '@bem-react/classname'
import { ClassValue, clsx } from 'clsx'

export declare interface IStyles {
  [className: string]: string;
}

declare type ElemMixType = ClassNameList;

const makeClassNameMaker = withNaming({ e: '__', m: '--', v: '_' })

export function classNames(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export const makeCn = (scopeName: string, styles: IStyles) => {
  const makeClassName = makeClassNameMaker(scopeName)

  return (
    elemNameOrBlockMods?: any,
    elemModsOrBlockMix?: any,
    elemMix?: ElemMixType,
  ) => {
    const classNames = makeClassName(elemNameOrBlockMods, elemModsOrBlockMix, elemMix).split(' ')

    // ИСПРАВЛЕНИЕ: Собираем только существующие классы и правильно их соединяем
    const resolvedClassNames = classNames
      .map(className => styles[className])
      .filter(Boolean) // Убираем undefined/null значения

    return resolvedClassNames.join(' ')
  }
}

// Альтернативный вариант с более подробной отладкой:
export const makeCnDebug = (scopeName: string, styles: IStyles) => {
  const makeClassName = makeClassNameMaker(scopeName)

  return (
    elemNameOrBlockMods?: any,
    elemModsOrBlockMix?: any,
    elemMix?: ElemMixType,
  ) => {
    const classNames = makeClassName(elemNameOrBlockMods, elemModsOrBlockMix, elemMix).split(' ')

    console.log('=== makeCn Debug ===')
    console.log('1. Input:', { elemNameOrBlockMods, elemModsOrBlockMix, elemMix })
    console.log('2. Generated classNames:', classNames)

    const resolvedClassNames = classNames.map(className => {
      const resolved = styles[className]
      console.log(`3. "${className}" -> "${resolved}"`)
      return resolved
    }).filter(Boolean)

    const result = resolvedClassNames.join(' ')
    console.log('4. Final result:', `"${result}"`)

    return result
  }
}
