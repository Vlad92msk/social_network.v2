// decorators/linkDecorator.tsx
import { PropsWithChildren } from 'react'
import { ContentState, DraftDecorator } from 'draft-js'

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

interface LinkProps {
  contentState?: ContentState
  entityKey?: string
  decoratedText: string
  children?: React.ReactNode
}

// Компонент для отрисовки ссылок
function Link(props: PropsWithChildren<LinkProps>) {
  const { decoratedText, contentState, children, entityKey } = props
  // Получаем URL либо из entity, либо используем сам текст как URL
  const url = entityKey ? contentState!.getEntity(entityKey).getData().url : decoratedText

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    if (isValidUrl(url)) {
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      console.warn('Невалидный URL:', url)
    }
  }

  return (
    <a
      href={url}
      onClick={onClick}
      style={{
        color: 'rgb(13 205 252)',
        cursor: 'pointer',
        textDecoration: 'none',
      }}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}

export const linkDecorator: DraftDecorator = {
  // Strategy - это функция, которая определяет, какие части текста должны быть декорированы
  // (в нашем случае - какие части текста являются ссылками)
  strategy: (
    contentBlock, // Блок контента, который проверяется
    callback, // Функция, вызываемая для каждого найденного совпадения
    contentState, // Текущее состояние контента
  ) => {
    // findEntityRanges ищет диапазоны текста, которые связаны с определенным entity
    contentBlock.findEntityRanges(
      // Предикат - функция, которая проверяет каждый символ
      (character) => {
        // Получаем ключ entity для текущего символа
        const entityKey = character.getEntity()
        // Проверяем:
        // 1. Есть ли entity у символа (entityKey !== null)
        // 2. Является ли entity ссылкой (тип === 'LINK')
        return entityKey !== null && contentState.getEntity(entityKey).getType() === 'LINK'
      },
      // callback вызывается для каждого найденного диапазона
      // и получает начальную и конечную позиции
      callback,
    )
  },
  component: Link,
}

const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g

export const urlDecorator: DraftDecorator = {
  strategy: (contentBlock, callback: (start: number, end: number) => void) => {
    // Получаем текст блока
    const text = contentBlock.getText()
    // Ищем все совпадения с регулярным выражением
    let matchArr = URL_REGEX.exec(text)
    while (matchArr !== null) {
      // start - индекс начала совпадения
      // end - индекс конца совпадения (start + длина совпадения)
      const start = matchArr.index
      const end = start + matchArr[0].length
      callback(start, end)
      // Ищем следующее совпадение
      matchArr = URL_REGEX.exec(text)
    }
  },
  component: Link,
}
