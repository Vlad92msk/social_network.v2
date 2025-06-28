// eslint-disable-next-line @typescript-eslint/ban-types
export const debounce = <F extends Function>(func: F, delay: number) => {
  let inDebounce: NodeJS.Timeout | string | number | undefined // Идентификатор таймера для отслеживания задержки

  // Возвращаемая функция, которая будет вызываться вместо исходной
  return function () {
    // Сохраняем контекст и аргументы вызова для возможного будущего вызова
    // @ts-ignore
    const context = this
    // eslint-disable-next-line prefer-rest-params
    const args: IArguments = arguments

    // Очищаем предыдущий таймер задержки, если функция вызвана повторно
    clearTimeout(inDebounce)

    // Устанавливаем новый таймер задержки
    inDebounce = setTimeout(() => {
      func.apply(context, args) // Вызываем функцию после истечения задержки
    }, delay)
  }
}
