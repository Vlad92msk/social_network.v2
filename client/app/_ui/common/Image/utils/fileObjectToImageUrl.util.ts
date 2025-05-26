/**
 * Тип для объекта, похожего на File с полем src
 */
export type FileWithSrc = {
  src?: string;
  name?: string;
  type?: string;
  [key: string]: any;
};

/**
 * Тип, объединяющий все возможные типы входных данных для изображений
 */
export type ImageSource = string | File | Blob | FileWithSrc | null | undefined;

/**
 * Проверяет, является ли объект Blob или File
 */
export const isBlobOrFile = (obj: any): obj is Blob | File => obj instanceof Blob || obj instanceof File

/**
 * Проверяет, является ли объект похожим на File с полем src
 */
export const isFileWithSrc = (obj: any): obj is FileWithSrc => obj && typeof obj === 'object' && 'src' in obj

/**
 * Преобразует различные типы источников изображений в строку URL
 * @param source - Источник изображения (строка, File, Blob или объект с полем src)
 * @param defaultImage - URL изображения по умолчанию (если source пустой)
 * @returns URL изображения в виде строки
 */
export const getImageUrl = (source: ImageSource, defaultImage: string = '/images/base/blur_img.webp'): string => {
  // Если источник пустой, возвращаем изображение по умолчанию
  if (!source) {
    return defaultImage
  }

  // Если источник - строка, форматируем её
  if (typeof source === 'string') {
    return formatImagePath(source, defaultImage)
  }

  // Если источник - Blob или File, создаем URL
  if (isBlobOrFile(source)) {
    return URL.createObjectURL(source)
  }

  // Если источник - объект с полем src, используем это поле
  if (isFileWithSrc(source) && source.src) {
    return formatImagePath(source.src, defaultImage)
  }

  // В остальных случаях возвращаем изображение по умолчанию
  return defaultImage
}

/**
 * Форматирует путь к изображению в зависимости от его формата
 * @param path - Путь к изображению
 * @param defaultImage - Изображение по умолчанию
 * @returns Отформатированный путь
 */
export const formatImagePath = (path: string, defaultImage: string): string => {
  if (!path) return defaultImage

  // Если путь уже в формате URL (blob, http или data), возвращаем как есть
  if (path.startsWith('blob:') || path.startsWith('http') || path.startsWith('data:')) {
    return path
  }

  // Если путь начинается с '/', считаем что изображение в папке public
  if (path.startsWith('/')) {
    return path
  }

  // В остальных случаях предполагаем, что это относительный путь в папке images
  return `/images/${path}.webp`
}

/**
 * Очищает URL, созданные с помощью URL.createObjectURL
 * @param url - URL для очистки
 */
export const revokeImageUrl = (url: string | undefined): void => {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/**
 * Конвертирует объект из формы загрузки файла в корректный URL для изображения
 * @param fileObject - Объект из формы загрузки файла
 * @returns URL изображения
 */
export const fileObjectToImageUrl = (fileObject: any): string => {
  // Проверяем, есть ли у объекта свойство src
  if (fileObject && typeof fileObject === 'object') {
    // Если есть прямое свойство src, используем его
    if ('src' in fileObject && typeof fileObject.src === 'string') {
      return fileObject.src
    }

    // Если объект является File/Blob, создаем URL
    if (isBlobOrFile(fileObject)) {
      return URL.createObjectURL(fileObject)
    }
  }

  // Если не удалось извлечь URL, возвращаем пустую строку
  return ''
}
