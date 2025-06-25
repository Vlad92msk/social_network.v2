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

    const resolvedClassNames = classNames
      .map(className => styles[className])
      .filter(Boolean)

    return resolvedClassNames.join(' ')
  }
}
