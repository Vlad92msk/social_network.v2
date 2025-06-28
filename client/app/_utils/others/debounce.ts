// eslint-disable-next-line @typescript-eslint/ban-models
export const debounce = <F extends Function>(func: F, delay: number) => {
  let inDebounce // Идентификатор таймера для отслеживания задержки

  // Возвращаемая функция, которая будет вызываться вместо исходной
  return function () {
    // Сохраняем контекст и аргументы вызова для возможного будущего вызова
    const context = this
    const args = arguments

    // Очищаем предыдущий таймер задержки, если функция вызвана повторно
    clearTimeout(inDebounce)

    // Устанавливаем новый таймер задержки
    inDebounce = setTimeout(() => {
      func.apply(context, args) // Вызываем функцию после истечения задержки
    }, delay)
  }
}
