import { MediaBreakKeys, mediaBreakpoints } from '@utils'
import { useEffect, useState, ImgHTMLAttributes } from 'react'
import {
  resolveImageUrl,
  ImageSource,
  revokeImageUrl,
  ImageFormatOptions,
  getOptimalFormatOptions
} from './utils/imageResolver'
import { getImageFormats } from './utils/imageRegistry'
import blurImage from '@assets/images/base/blur_img.webp'

export type SizesConfig = Partial<Record<MediaBreakKeys, string>> | string | undefined

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'sizes' | 'srcSet'> {
  src?: ImageSource
  pictureClassName?: string
  srcSet?: Partial<Record<MediaBreakKeys, ImageSource>>
  sizes?: SizesConfig
  fallbackSrc?: string

  // Прогрессивная загрузка
  placeholderSrc?: string
  blur?: number
  showPlaceholder?: boolean

  // Настройки форматов (по умолчанию - автоопределение по браузеру)
  formatOptions?: ImageFormatOptions

  // Отладка
  debug?: boolean
}

function createSizeString(bp: typeof mediaBreakpoints, sizes: SizesConfig) {
  if (!sizes) return undefined
  if (typeof sizes === 'string') return sizes

  let sizeString = ''
  for (const key in bp) {
    const breakpointKey = key as MediaBreakKeys
    if (Object.prototype.hasOwnProperty.call(bp, key) && sizes[breakpointKey]) {
      sizeString += `(min-width: ${bp[breakpointKey]}px) ${sizes[breakpointKey]}, `
    }
  }

  return sizeString || '100vw'
}

export function Image(props: ImageProps) {
  const {
    src,
    pictureClassName,
    sizes,
    srcSet,
    fallbackSrc = blurImage,
    placeholderSrc,
    blur = 4,
    showPlaceholder = true,
    formatOptions,
    debug = false,
    style,
    ...rest
  } = props
console.log('cc', rest)
  const [imageSrc, setImageSrc] = useState<string>(placeholderSrc || fallbackSrc)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [sourceSrcSet, setSourceSrcSet] = useState<Record<string, string>>({})
  const [blobUrls, setBlobUrls] = useState<string[]>([])

  // Автоматическое определение оптимальных настроек форматов
  const optimalOptions = formatOptions || getOptimalFormatOptions()

  // Обработка основного изображения
  useEffect(() => {
    if (!src) {
      setImageSrc(fallbackSrc)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setIsError(false)

    try {
      const url = resolveImageUrl(src, fallbackSrc, optimalOptions)

      // Отладочная информация
      if (debug && typeof src === 'string' && !src.startsWith('http') && !src.startsWith('/') && !src.startsWith('blob:')) {
        const formats = getImageFormats(src)
        console.log(`🎨 Available formats for ${src}:`, formats)
        console.log(`⚙️ Using format options:`, optimalOptions)
      }

      if (debug) {
        console.log(`🖼️ Image resolved:`, url)
      }

      // Показываем placeholder сначала
      if (showPlaceholder && placeholderSrc) {
        setImageSrc(placeholderSrc)
      }

      // Предзагружаем основное изображение
      const img = new window.Image()
      img.onload = () => {
        setImageSrc(url)
        setIsLoading(false)
        if (debug) {
          console.log(`✅ Image loaded successfully: ${url}`)
        }
      }
      img.onerror = () => {
        setImageSrc(fallbackSrc)
        setIsLoading(false)
        setIsError(true)
        if (debug) {
          console.error(`❌ Failed to load image: ${url}`)
        }
      }
      img.src = url

      if (url.startsWith('blob:')) {
        setBlobUrls(prev => [...prev, url])
      }
    } catch (error) {
      if (debug) {
        console.error('❌ Failed to resolve image:', src, error)
      }
      setImageSrc(fallbackSrc)
      setIsLoading(false)
      setIsError(true)
    }
  }, [src, fallbackSrc, placeholderSrc, showPlaceholder, optimalOptions, debug])

  // Обработка srcSet
  useEffect(() => {
    if (!srcSet) return

    try {
      const newSourceSrcSet: Record<string, string> = {}
      const newBlobUrls: string[] = []

      for (const [key, value] of Object.entries(srcSet)) {
        const url = resolveImageUrl(value, fallbackSrc, optimalOptions)
        newSourceSrcSet[key] = url

        if (debug) {
          console.log(`📱 SrcSet resolved [${key}]:`, url)
        }

        if (url.startsWith('blob:')) {
          newBlobUrls.push(url)
        }
      }

      setSourceSrcSet(newSourceSrcSet)
      setBlobUrls(prev => [...prev, ...newBlobUrls])
    } catch (error) {
      if (debug) {
        console.error('❌ Failed to resolve srcSet:', error)
      }
    }
  }, [srcSet, fallbackSrc, optimalOptions, debug])

  // Очистка blob URLs при размонтировании
  useEffect(() => () => {
    blobUrls.forEach(url => {
      revokeImageUrl(url)
      if (debug) {
        console.log('🧹 Cleaned up blob URL:', url)
      }
    })
  }, [blobUrls, debug])

  // Создаем источники для разных форматов (автоматически для assets изображений)
  const renderSources = () => {
    if (!src || typeof src !== 'string' || src.startsWith('http') || src.startsWith('/') || src.startsWith('blob:')) {
      return null
    }

    const formats = getImageFormats(src)
    const sources = []

    // AVIF источник
    if (optimalOptions.enableAvif && formats.avif) {
      sources.push(
        <source
          key="avif"
          srcSet={formats.avif}
          type="image/avif"
        />
      )
    }

    // WebP источник
    if (optimalOptions.enableWebp && formats.webp) {
      sources.push(
        <source
          key="webp"
          srcSet={formats.webp}
          type="image/webp"
        />
      )
    }

    return sources
  }

  const imageStyle = {
    filter: isLoading && blur ? `blur(${blur}px)` : undefined,
    transition: 'filter 0.3s ease-out',
    ...style,
  }

  return (
    <picture className={pictureClassName}>
      {renderSources()}

      {srcSet && Object.entries(sourceSrcSet).map(([key, value]) => (
        <source
          key={key}
          srcSet={value}
          media={`(min-width: ${mediaBreakpoints[key as MediaBreakKeys]}px)`}
        />
      ))}

      <img
        src={imageSrc}
        sizes={createSizeString(mediaBreakpoints, sizes)}
        loading="lazy"
        style={imageStyle}
        {...rest}
        onError={(e) => {
          setIsError(true)
          setIsLoading(false)
          if (debug) {
            console.error('❌ Image failed to load in browser:', imageSrc)
          }
          if (rest.onError) rest.onError(e)
        }}
        onLoad={(e) => {
          if (!isError) {
            setIsLoading(false)
          }
          if (debug) {
            console.log('✅ Image loaded successfully in browser:', imageSrc)
          }
          if (rest.onLoad) rest.onLoad(e)
        }}
      />
    </picture>
  )
}
