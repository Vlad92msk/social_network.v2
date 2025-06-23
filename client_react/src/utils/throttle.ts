export const throttle = (func, limit) => {
  let inThrottle // Флаг, указывающий, находится ли функция в режиме "троттлинга"
  // Возвращаемая функция, которая будет вызываться вместо исходной
  return function () {
    if (!inThrottle) { // Проверяем, не "затроттлены" ли мы уже
      // eslint-disable-next-line prefer-rest-params
      func.apply(this, arguments) // Вызываем исходную функцию
      inThrottle = true // Устанавливаем флаг "троттлинга"
      // Сбрасываем флаг после истечения времени limit
      // eslint-disable-next-line no-return-assign
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
