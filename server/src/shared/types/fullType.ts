import { Type } from '@nestjs/common'

export function FullType<T>(classRef: Type<T>): Type<Required<T>> {
  class FullTypeClass {
    constructor() {
      Object.keys(new classRef()).forEach((key) => {
        this[key] = new classRef()[key]
      })
    }
  }

  return FullTypeClass as Type<Required<T>>
}
