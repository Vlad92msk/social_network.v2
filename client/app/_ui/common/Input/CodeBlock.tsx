import { CompositeDecorator, ContentBlock, ContentState } from 'draft-js'

// Компонент для кастомного форматирования
function CustomComponent(props: any) {
  return (
    <span style={{ color: 'red' }}><a>{props.children}</a></span>
  )
}

// Функция-стратегия для поиска текста
const findCustomText = (contentBlock: ContentBlock, callback: Function, contentState: ContentState) => {
  // Здесь можно использовать регулярные выражения или другую логику для поиска текста
  const text = contentBlock.getText()
  const customStyle = contentBlock.getInlineStyleAt(0).has('CUSTOM_STYLE')

  if (customStyle) {
    callback(0, text.length)
  }
}

// Создаем декоратор
export const compositeDecorator = new CompositeDecorator([
  {
    strategy: findCustomText,
    component: CustomComponent,
  },
])
