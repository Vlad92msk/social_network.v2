import React from 'react'
import InlineSVG from 'react-inlinesvg'
import { Props } from 'react-inlinesvg/src'
import { IconName } from './icon.model'

interface BaseIconPros extends Omit<Props, 'src' |'name'>{
  name: IconName
}

export function BaseIcon({ name, ...props }: BaseIconPros) {
  const svgURL = `/icons/${name}.svg`

  return <InlineSVG src={svgURL} {...props} />
}
