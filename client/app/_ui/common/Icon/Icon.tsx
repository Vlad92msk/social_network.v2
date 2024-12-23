'use client'

import { memo, SVGProps } from 'react'
import { IconName } from './icon.model'
import { icons } from './icons'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  className?: string
}

export const Icon = memo(({ name, ...props }: IconProps) => {
  const IconComponent = icons[name]
  return IconComponent ? <IconComponent {...props} /> : null
})

Icon.displayName = 'Icon'
