import { useEffect, useMemo, useReducer, useRef } from 'react'
import { classNames } from '@utils'
import Prism from 'prismjs'

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
      // Динамически загружаем языки
      const loadLanguages = async () => {
        const languages = ['typescript', 'javascript', 'python', 'java', 'cpp']

        for (const lang of languages) {
          try {
            await import(`prismjs/components/prism-${lang}`)
          } catch (error) {
            console.warn(`Failed to load Prism language: ${lang}`, error)
          }
        }

        isInitialized.current = true
        forceUpdate()
      }

      loadLanguages()
    }
  }, [])

  // Подсвечиваем код только если Prism инициализирован
  const html = useMemo(() => {
    if (!isInitialized.current) return code

    try {
      return Prism.highlight(code, Prism.languages[language] || Prism.languages.typescript, language)
    } catch (e) {
      console.error('Prism highlight error:', e)
      return code
    }
  }, [code, language])

  return (
    <pre className={classNames(cn('PrismCode'), className)}>
      <code className={`language-${language}`} dangerouslySetInnerHTML={{ __html: html }} />
    </pre>
  )
}
