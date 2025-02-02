export function parsePath(path: string): string[] {
  // Разбиваем путь на части, учитывая и точки, и квадратные скобки
  return path
    .replace(/\[/g, '.') // заменяем [ на .
    .replace(/\]/g, '') // убираем ]
    .split('.')
    .filter(Boolean) // убираем пустые строки
}

export function getValueByPath(obj: any, path: string) {
  return parsePath(path).reduce((curr, key) => (curr === undefined ? undefined : curr[key]), obj)
}

export function setValueByPath(obj: any, path: string, value: any): any {
  if (path === '') return value

  const parts = parsePath(path)
  const lastKey = parts.pop()!
  const target = parts.reduce((curr, key) => {
    // Если следующая часть пути - число, создаем массив
    const nextKey = parts[parts.indexOf(key) + 1]
    const shouldBeArray = !Number.isNaN(Number(nextKey))

    if (!(key in curr)) {
      curr[key] = shouldBeArray ? [] : {}
    }
    return curr[key]
  }, obj)

  target[lastKey] = value
  return obj
}
