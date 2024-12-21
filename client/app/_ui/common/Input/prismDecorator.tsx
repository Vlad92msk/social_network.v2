// prismDecorator.tsx

'use client'

import { DefaultDraftBlockRenderMap } from 'draft-js'
import { Map } from 'immutable'
import { useEffect } from 'react'

function TokenSpan(props: any) {
  // Получаем тип токена из декоратора
  const { tokenType } = props.decoratedText.getEntityAt(0)?.getData() || {}

  // Применяем соответствующий класс из Prism
  return (
    <span className={`token ${tokenType || ''}`}>
      {props.children}
    </span>
  )
}

const findCodeText = (contentBlock: any, callback: any) => {
  if (contentBlock.getType() === 'code-block' && typeof window !== 'undefined' && window.Prism) {
    const text = contentBlock.getText()
    const grammar = window.Prism.languages.typescript

    try {
      // Разбиваем текст на токены с помощью Prism
      const tokens = window.Prism.tokenize(text, grammar)

      let offset = 0
      tokens.forEach((token: any) => {
        if (typeof token === 'string') {
          // Пропускаем простой текст
          offset += token.length
        } else {
          // Для каждого токена вызываем callback с его позицией
          callback(offset, offset + token.content.length)
          offset += token.content.length
        }
      })
    } catch (e) {
      // Если что-то пошло не так, просто выделяем весь блок
      callback(0, contentBlock.getLength())
    }
  }
}

// Максимально простой CodeBlock
function CodeBlock(props: any) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Prism) {
      window.Prism.highlightAll()
    }
  }, [props.children])

  return (
    <pre
      className="language-typescript rounded-lg"
      style={{
        background: 'rgb(40, 44, 52)',
        margin: '0.5em 0px',
        padding: '1em',
      }}
    >
      <code>
        {props.children}
      </code>
    </pre>
  )
}

const blockRenderMap = DefaultDraftBlockRenderMap.merge(
  Map({
    'code-block': {
      element: 'pre',
      wrapper: <CodeBlock />,
    },
  }),
)
