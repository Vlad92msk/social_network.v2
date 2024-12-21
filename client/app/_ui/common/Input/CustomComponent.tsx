// decorators/linkDecorator.tsx
import { ContentState, DraftDecorator } from 'draft-js'

type DecoratorComponentProps = {
  contentState: ContentState
  entityKey: string
  children: React.ReactNode
}

// Заменяем React.FC на простую функцию
const LinkComponent = ({
  children,
}: DecoratorComponentProps) => (
  <span className="text-blue-500 cursor-pointer hover:underline">
    {children}
  </span>
)
// Для ссылок - ищем http:// или https:// и дальше любые символы до пробела
const LINK_REGEX = /https?:\/\/\S+/g
export const linkDecorator: DraftDecorator = {
  strategy: (contentBlock, callback) => {
    const text = contentBlock.getText()
    let matchArr: RegExpExecArray | null
    while ((matchArr = LINK_REGEX.exec(text)) !== null) {
      const start = matchArr.index
      const end = start + matchArr[0].length
      callback(start, end)
    }
  },
  component: LinkComponent,
}

// decorators/boldDecorator.tsx
const BoldComponent = ({
  children,
}: DecoratorComponentProps) => (
  <strong style={{ fontWeight: 'bold', color: 'redк' }}>{children}</strong>
)

// Изменяем регулярное выражение - используем позитивный lookbehind и lookahead
const BOLD_REGEX = /\*\*([^*]+)\*\*/g
export const boldDecorator: DraftDecorator = {
  strategy: (contentBlock, callback) => {
    const text = contentBlock.getText()
    // Находим весь текст между **
    const matches = text.matchAll(BOLD_REGEX)

    // Для каждого найденного совпадения вызываем callback
    for (const match of matches) {
      if (match.index !== undefined) {
        // match[1] содержит текст между **, а match[0] - весь текст включая **
        const start = match.index + 2 // пропускаем начальные **
        const end = start + match[1].length // берем только текст между **
        callback(start, end)
      }
    }
  },
  component: BoldComponent,
}
