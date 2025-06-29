import { getAvifImageSrc, getImageSrc, getSvgImageSrc, getWebpImageSrc, images } from './imageRegistry'

/**
 * Типы источников изображений
 */
export type FileWithSrc = {
  src?: string
  name?: string
  type?: string
  [key: string]: any
}

export type ImageSource = string | File | Blob | FileWithSrc | null | undefined

/**
 * Проверяет, является ли объект Blob или File
 */
export const isBlobOrFile = (obj: any): obj is Blob | File => obj instanceof Blob || obj instanceof File

/**
 * Проверяет, является ли объект похожим на File с полем src
 */
export const isFileWithSrc = (obj: any): obj is FileWithSrc => obj && typeof obj === 'object' && 'src' in obj

/**
 * Настройки выбора формата изображения
 */
export interface ImageFormatOptions {
  enableAvif?: boolean
  enableWebp?: boolean
  enableSvg?: boolean
}

/**
 * Получает лучшее доступное изображение в порядке приоритета
 */
export const getBestAvailableImage = (imagePath: string, fallbackSrc: string, options: ImageFormatOptions = {}): string => {
  const { enableAvif = true, enableWebp = true, enableSvg = true } = options

  // 1. Пробуем AVIF (лучшее сжатие)
  if (enableAvif) {
    const avif = getAvifImageSrc(imagePath)
    if (avif) {
      console.log(`✅ Using AVIF: ${imagePath}.avif`)
      return avif
    }
  }

  // 2. Пробуем WebP (хорошее сжатие)
  if (enableWebp) {
    const webp = getWebpImageSrc(imagePath)
    if (webp) {
      console.log(`✅ Using WebP: ${imagePath}.webp`)
      return webp
    }
  }

  // 3. Пробуем SVG (для иконок)
  if (enableSvg) {
    const svg = getSvgImageSrc(imagePath)
    if (svg) {
      console.log(`✅ Using SVG: ${imagePath}.svg`)
      return svg
    }
  }

  // 4. Пробуем основной файл (любое расширение)
  const mainImage = getImageSrc(imagePath)
  if (mainImage) {
    console.log(`✅ Using main: ${imagePath}`)
    return mainImage
  }

  // 5. Используем fallback
  console.warn(`⚠️ No image found for: ${imagePath}`)
  console.warn(
    `📁 Available images:`,
    Object.keys(images)
      .filter((key) => !key.includes('.'))
      .slice(0, 10),
  )

  return fallbackSrc
}

/**
 * Проверяет поддержку форматов браузером
 */
export const checkBrowserSupport = () => {
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1

  return {
    avif: canvas.toDataURL('image/avif').startsWith('data:image/avif'),
    webp: canvas.toDataURL('image/webp').startsWith('data:image/webp'),
  }
}

/**
 * Получает оптимальные настройки на основе поддержки браузера
 */
export const getOptimalFormatOptions = (): ImageFormatOptions => {
  const support = checkBrowserSupport()

  return {
    enableAvif: support.avif,
    enableWebp: support.webp,
    enableSvg: true, // SVG поддерживается везде
  }
}

/**
 * Форматирует путь к изображению в зависимости от его формата
 */
export const formatImagePath = (path: string, defaultImage: string, options?: ImageFormatOptions): string => {
  if (!path) return defaultImage

  // Если путь уже в формате URL (blob, http или data), возвращаем как есть
  if (path.startsWith('blob:') || path.startsWith('http') || path.startsWith('data:')) {
    return path
  }

  // Если путь начинается с '/', считаем что изображение в папке public
  if (path.startsWith('/')) {
    return path
  }

  // Для остальных случаев используем автоматический поиск
  return getBestAvailableImage(path, defaultImage, options)
}

/**
 * Основная функция разрешения URL изображения
 */
export const resolveImageUrl = (source: ImageSource, defaultImage: string = '', options?: ImageFormatOptions): string => {
  // Если источник пустой, возвращаем изображение по умолчанию
  if (!source) {
    return defaultImage
  }

  // Если источник - строка, проверяем её тип
  if (typeof source === 'string') {
    return formatImagePath(source, defaultImage, options)
  }

  // Если источник - Blob или File, создаем URL
  if (isBlobOrFile(source)) {
    return URL.createObjectURL(source)
  }

  // Если источник - объект с полем src, используем это поле
  if (isFileWithSrc(source) && source.src) {
    return formatImagePath(source.src, defaultImage, options)
  }

  // В остальных случаях возвращаем изображение по умолчанию
  return defaultImage
}

/**
 * Очищает URL, созданные с помощью URL.createObjectURL
 */
export const revokeImageUrl = (url: string | undefined): void => {
  if (url && typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
