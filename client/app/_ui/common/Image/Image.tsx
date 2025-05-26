'use client'

import NextImage, { ImageProps as NextImageProps } from 'next/image'
import { useEffect, useState } from 'react'
import { MediaBreakKeys, mediaBreakpoints } from '@ui/styles/variables/media'
import { getImageUrl, ImageSource, revokeImageUrl } from './utils/fileObjectToImageUrl.util'

export type Test = Partial<Record<MediaBreakKeys, string>> | string | undefined

export interface ImageCommonProps extends Omit<NextImageProps, 'src' | 'loading' | 'sizes'> {
  src?: ImageSource
  pictureClassName?: string
  srcSet?: Partial<Record<MediaBreakKeys, ImageSource>>
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
    blurDataURL = '/images/base/blur_img.webp',
    placeholder = 'blur',
    sizes,
    srcSet,
    ...rest
  } = props

  const [imageSrc, setImageSrc] = useState<string>(blurDataURL)
  const [sourceSrcSet, setSourceSrcSet] = useState<Record<string, string>>({})
  const [blobUrls, setBlobUrls] = useState<string[]>([])

  // Обработка основного изображения
  useEffect(() => {
    if (!src) {
      setImageSrc(blurDataURL)
      return
    }

    const url = getImageUrl(src, blurDataURL)
    setImageSrc(url)

    // Если это URL blob, добавляем его в список для последующей очистки
    if (url.startsWith('blob:')) {
      setBlobUrls((prev) => [...prev, url])
    }

    return () => {
      // Очистка URL при размонтировании
      if (url.startsWith('blob:')) {
        revokeImageUrl(url)
      }
    }
  }, [src, blurDataURL])

  // Обработка srcSet
  useEffect(() => {
    if (!srcSet) return

    const newSourceSrcSet: Record<string, string> = {}
    const newBlobUrls: string[] = []

    const processSource = async () => {
      for (const [key, value] of Object.entries(srcSet)) {
        const url = getImageUrl(value, blurDataURL)
        newSourceSrcSet[key] = url

        // Если это blob URL, добавляем его в список для последующей очистки
        if (url.startsWith('blob:')) {
          newBlobUrls.push(url)
        }
      }

      setSourceSrcSet(newSourceSrcSet)
      setBlobUrls((prev) => [...prev, ...newBlobUrls])
    }

    processSource()

    // Очистка URL при размонтировании
    return () => {
      newBlobUrls.forEach((url) => revokeImageUrl(url))
    }
  }, [srcSet, blurDataURL])

  // Очистка всех blob URL при размонтировании компонента
  useEffect(() => () => {
    blobUrls.forEach((url) => revokeImageUrl(url))
  }, [blobUrls])

  return (
    <picture className={pictureClassName}>
      {srcSet && Object.entries(sourceSrcSet).map(([key, value]) => (
        <source
          key={key}
          srcSet={value}
          media={`(min-width: ${mediaBreakpoints[key]}px)`}
        />
      ))}
      <NextImage
        src={imageSrc}
        sizes={createSizeString(mediaBreakpoints, sizes)}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        loading="lazy"
        {...rest}
      />
    </picture>
  )
}
