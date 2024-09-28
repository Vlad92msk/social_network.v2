import { Transform } from 'class-transformer'

export function TransformToEnum(enumType: object) {
  return Transform(({ value }) => {

    // Если значение - массив, берем первый элемент
    const actualValue = Array.isArray(value) ? value[0] : value

    if (typeof actualValue === 'string' && Object.values(enumType).includes(actualValue)) {
      return actualValue
    }
    if (typeof actualValue === 'number' && Object.values(enumType).includes(enumType[actualValue])) {
      return enumType[actualValue]
    }
    return undefined
  })
}
