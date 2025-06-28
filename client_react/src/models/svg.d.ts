/**
 * / <reference models="vite/client" />
 * / <reference models="vite-plugin-svgr/client" />
 */

// Обычные SVG как URL
declare module '*.svg' {
  const content: string
  export default content
}

// SVG как React компоненты
declare module '*.svg?react' {
  import { FunctionComponent, SVGProps } from 'react'

  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement> & { title?: string }>
  export default ReactComponent
}

// SVG как URL (явно)
declare module '*.svg?url' {
  const content: string
  export default content
}
