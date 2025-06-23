import { Property } from 'csstype'

// Массив доступных символов для генерации обратного цвета
const colors = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f']

/**
 * Функция для инвертирования цвета.
 * @param col - Исходный цвет, который нужно инвертировать.
 * @returns Инвертированный цвет.
 */
export const invertColor = (col: Property.Color | undefined): Property.Color | undefined => {
  if (!col) return undefined

  // Приводим цвет к нижнему регистру
  const lowercaseCol = col.toLowerCase()

  let inverseColor = '#'

  // Удаляем символ '#' и разбиваем цвет на отдельные символы
  lowercaseCol
    .replace('#', '')
    .split('')
    .forEach((char) => {
      // Ищем индекс текущего символа в массиве доступных символов
      const index = colors.indexOf(char)

      // Добавляем обратный символ в инвертированный цвет
      inverseColor += colors[colors.length - 1 - index]
    })

  return inverseColor as Property.Color
}
