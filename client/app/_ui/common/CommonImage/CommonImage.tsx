'use client'

import Image, { ImageProps } from 'next/image'
import { MediaBreakKeys, mediaBreakpoints } from '@ui/styles/variables/media'

export type Test = Partial<Record<MediaBreakKeys, string>> | string | undefined

export interface CommonImageProps extends Omit<ImageProps, 'src' | 'loading' | 'sizes'> {
  src: string
  pictureClassName?: string
  srcSet?: Partial<Record<MediaBreakKeys, string>>;
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
    if (bp.hasOwnProperty(key) && sss[key]) {
      sizeString += `(min-width: ${bp[key]}px) ${sss[key]}, `
    }
  }

  return sizeString || '100vw' // Значение по умолчанию, если не определено
}

export function CommonImage(props: CommonImageProps) {
  const {
    src, pictureClassName, blurDataURL = '/images/base/blur_img.webp', placeholder = 'blur', sizes, srcSet, ...rest
  } = props

  return (
    <picture className={pictureClassName}>
      {srcSet && Object.entries(srcSet).map(([key, value]) => (
        <source
          key={key}
          srcSet={`/images/${value}.webp 1x`}
          media={`(min-width: ${mediaBreakpoints[key]}px)`}
        />
      ))}
      <Image
        src={`/images/${src}.webp`}
        sizes={createSizeString(mediaBreakpoints, sizes)}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        loading="lazy"
        {...rest}
      />
    </picture>
  )
}
