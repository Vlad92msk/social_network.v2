import InlineSVG from 'react-inlinesvg'
import { Props } from 'react-inlinesvg/src'
import { IconName } from './icon.model'

interface IconBasePros extends Omit<Props, 'src' |'name'>{
  name: IconName
}

export function IconBase({ name, ...props }: IconBasePros) {
  const svgURL = `/icons/${name}.svg`

  return <InlineSVG src={svgURL} {...props} />
}
