'use client'

import NextImage, { ImageProps as NextImageProps } from 'next/image'
import { MediaBreakKeys, mediaBreakpoints } from '@ui/styles/variables/media'

// Импортируем изображение для blur по умолчанию
import defaultBlurImage from "app/_assets/images/base/blur_img.webp"

export type Test = Partial<Record<MediaBreakKeys, string>> | string | undefined

export interface ImageCommonProps extends Omit<NextImageProps, 'src' | 'loading' | 'sizes'> {
  src?: string
  pictureClassName?: string
  srcSet?: Partial<Record<MediaBreakKeys, string>>
  sizes?: Test
}

function createSizeString(bp: typeof mediaBreakpoints, sss: Test) {
  if (sss === undefined) {
    return undefined
  }
  if (typeof sss === 'string') {
    return sss
  }

  let sizeString = ''
  for (const key in bp) {
    if (Object.prototype.hasOwnProperty.call(bp, key) && sss[key]) {
      sizeString += `(min-width: ${bp[key]}px) ${sss[key]}, `
    }
  }

  return sizeString || '100vw'
}

export function Image(props: ImageCommonProps) {
  const {
    src,
    pictureClassName,
    blurDataURL = defaultBlurImage.src, // Используем импортированное изображение
    placeholder = 'blur',
    sizes,
    srcSet,
    ...rest
  } = props

  const getImageSrc = (imagePath: string) => {
    if (!imagePath) return blurDataURL
    if (imagePath.startsWith('http')) return imagePath
    // Если путь начинается с '/', считаем что изображение в папке public
    if (imagePath.startsWith('/')) return imagePath
    return `/images/${imagePath}.webp`
  }

  return (
    <picture className={pictureClassName}>
      {srcSet && Object.entries(srcSet).map(([key, value]) => (
        <source
          key={key}
          srcSet={getImageSrc(value)}
          media={`(min-width: ${mediaBreakpoints[key]}px)`}
        />
      ))}
      <NextImage
        src={getImageSrc(src || '')}
        sizes={createSizeString(mediaBreakpoints, sizes)}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        loading="lazy"
        {...rest}
      />
    </picture>
  )
}
