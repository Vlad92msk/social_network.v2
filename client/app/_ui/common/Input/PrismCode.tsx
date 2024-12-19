'use client'

import Prism from 'prismjs'
import { useEffect, useMemo, useReducer, useRef } from 'react'
import { classNames } from '@utils/others'
import { cn } from './cn'
import { CodeLanguage } from './CodeEditor'

interface PrismCodeProps {
  code: string
  language: CodeLanguage
  className?: string
}

export function PrismCode({ code, language, className }: PrismCodeProps) {
  const isInitialized = useRef(false)
  // Используем состояние для принудительного ре-рендера
  const [, forceUpdate] = useReducer((x) => x + 1, 0)

  useEffect(() => {
    if (!isInitialized.current) {
      // Импортируем языки только один раз при первом рендере
      Promise.all([
        import('prismjs/components/prism-typescript'),
        import('prismjs/components/prism-javascript'),
        import('prismjs/components/prism-python'),
        import('prismjs/components/prism-java'),
        import('prismjs/components/prism-cpp')
      ]).then(() => {
        isInitialized.current = true
        // Принудительно вызываем ре-рендер
        forceUpdate()
      })
    }
  }, [])



  // Подсвечиваем код только если Prism инициализирован
  const html = useMemo(() => {
    if (!isInitialized.current) return code

    try {
      return Prism.highlight(
        code,
        Prism.languages[language] || Prism.languages.typescript,
        language
      )
    } catch (e) {
      console.error('Prism highlight error:', e)
      return code
    }
  }, [code, language])

  return (
    <pre className={classNames(cn('PrismCode'), className)}>
      <code
        className={`language-${language}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </pre>
  )
}
