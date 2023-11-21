import React from 'react'
import InlineSVG from 'react-inlinesvg'
import { Props } from 'react-inlinesvg/src'
import { IconName } from './icon.model'


interface IconPros extends Omit<Props, 'src' |'name'>{
  name: IconName
}

export function Icon({ name, ...props }: IconPros) {
  const svgURL = `/icons/${name}.svg`

  return <InlineSVG src={svgURL} {...props} />
}
