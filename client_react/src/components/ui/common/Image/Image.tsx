import { ImgHTMLAttributes, useCallback, useEffect, useMemo, useState } from 'react'
import blurImage from '@assets/images/base/blur_img.webp'
import { MediaBreakKeys, mediaBreakpoints } from '@utils'

import { getImageFormats } from './utils/imageRegistry'
import { getOptimalFormatOptions, ImageFormatOptions, ImageSource, resolveImageUrl, revokeImageUrl } from './utils/imageResolver'

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
  const { src, pictureClassName, sizes, srcSet, fallbackSrc = blurImage, placeholderSrc, blur = 4, showPlaceholder = true, formatOptions, style, onError, onLoad, ...rest } = props

  const [imageSrc, setImageSrc] = useState<string>(placeholderSrc || fallbackSrc)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [sourceSrcSet, setSourceSrcSet] = useState<Record<string, string>>({})
  const [blobUrls, setBlobUrls] = useState<string[]>([])

  const optimalOptions = useMemo(() => formatOptions || getOptimalFormatOptions(), [formatOptions])
  const sizesString = useMemo(() => createSizeString(mediaBreakpoints, sizes), [sizes])
  const imageStyle = useMemo(
    () => ({
      filter: isLoading && blur ? `blur(${blur}px)` : undefined,
      transition: 'filter 0.3s ease-out',
      ...style,
    }),
    [isLoading, blur, style],
  )

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setIsError(true)
      setIsLoading(false)
      onError?.(e)
    },
    [onError],
  )

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (!isError) {
        setIsLoading(false)
      }
      onLoad?.(e)
    },
    [isError, onLoad],
  )

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

      // Показываем placeholder сначала
      if (showPlaceholder && placeholderSrc) {
        setImageSrc(placeholderSrc)
      }

      // Предзагружаем основное изображение
      const img = new window.Image()
      img.onload = () => {
        setImageSrc(url)
        setIsLoading(false)
      }
      img.onerror = () => {
        setImageSrc(fallbackSrc)
        setIsLoading(false)
        setIsError(true)
      }
      img.src = url

      if (url.startsWith('blob:')) {
        setBlobUrls((prev) => [...prev, url])
      }
    } catch (error) {
      setImageSrc(fallbackSrc)
      setIsLoading(false)
      setIsError(true)
    }
  }, [src, fallbackSrc, placeholderSrc, showPlaceholder, optimalOptions])

  // Обработка srcSet
  useEffect(() => {
    if (!srcSet) return

    const newSourceSrcSet: Record<string, string> = {}
    const newBlobUrls: string[] = []

    for (const [key, value] of Object.entries(srcSet)) {
      const url = resolveImageUrl(value, fallbackSrc, optimalOptions)
      newSourceSrcSet[key] = url

      if (url.startsWith('blob:')) {
        newBlobUrls.push(url)
      }
    }

    setSourceSrcSet(newSourceSrcSet)
    setBlobUrls((prev) => [...prev, ...newBlobUrls])
  }, [srcSet, fallbackSrc, optimalOptions])

  // Очистка blob URLs при размонтировании
  useEffect(
    () => () => {
      blobUrls.forEach((url) => {
        revokeImageUrl(url)
      })
    },
    [blobUrls],
  )

  const sources = useMemo(() => {
    if (!src || typeof src !== 'string' || src.startsWith('http') || src.startsWith('/') || src.startsWith('blob:')) {
      return null
    }

    const formats = getImageFormats(src)
    const sourceElements = []

    // AVIF источник
    if (optimalOptions.enableAvif && formats.avif) {
      sourceElements.push(<source key="avif" srcSet={formats.avif} type="image/avif" />)
    }

    // WebP источник
    if (optimalOptions.enableWebp && formats.webp) {
      sourceElements.push(<source key="webp" srcSet={formats.webp} type="image/webp" />)
    }

    return sourceElements
  }, [src, optimalOptions])

  // srcSet источники
  const srcSetSources = useMemo(() => {
    if (!srcSet || !Object.keys(sourceSrcSet).length) return null

    return Object.entries(sourceSrcSet).map(([key, value]) => <source key={key} srcSet={value} media={`(min-width: ${mediaBreakpoints[key as MediaBreakKeys]}px)`} />)
  }, [srcSet, sourceSrcSet])

  return (
    <picture className={pictureClassName}>
      {sources}
      {srcSetSources}

      <img src={imageSrc} sizes={sizesString} loading="lazy" style={imageStyle} onError={handleError} onLoad={handleLoad} {...rest} />
    </picture>
  )
}
