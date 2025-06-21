import { memo, SVGProps } from 'react'
import { icons } from './icons'
import { IconName } from './icon.model'

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName
  size?: number | string
}

export const Icon = memo(({ name, size = 24, className, ...props }: IconProps) => {
  const IconComponent = icons[name]

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }

  return (
    <IconComponent
      className={className}
      width={size}
      height={size}
      {...props}
    />
  )
})

Icon.displayName = 'Icon'
