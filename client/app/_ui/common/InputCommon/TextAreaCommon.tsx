import { TextareaProps as ChakraTextAreaProps } from '@chakra-ui/react'
import { RefObject, useEffect, useRef } from 'react'
import { TextCommon, TextCommonProps } from '@ui/common/TextCommon'

import { classNames, rem } from '@utils/others'
import { cn } from './cn'

function useAutoResize(ref: RefObject<HTMLTextAreaElement>) {
  useEffect(() => {
    const element = ref.current

    const handleResize = () => {
      if (element) {
        if (!element.value) {
          // Если textarea пустой, установить минимальную высоту
          element.style.height = '1.5em'
        } else {
          // В противном случае адаптировать высоту под содержимое
          element.style.height = 'auto' // Сбрасываем высоту для получения точного значения scrollHeight
          const newHeight = element.scrollHeight
          element.style.height = String(rem(newHeight)) // Устанавливаем высоту равной высоте содержимого
        }
      }
    }

    if (element) {
      element.addEventListener('input', handleResize)
      window.addEventListener('resize', handleResize)
    }

    // Вызываем сразу для инициализации
    handleResize()

    return () => {
      if (element) {
        element.removeEventListener('input', handleResize)
        window.removeEventListener('resize', handleResize)
      }
    }
  }, [ref]) // Хук не зависит от внешних переменных
}

interface InputCommonProps extends TextCommonProps, Pick<ChakraTextAreaProps, 'placeholder' | 'value' | 'onChange' | 'onBlur'> {
// className?: string
}

export function TextAreaCommon(props: InputCommonProps) {
  const { className, ...rest } = props
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useAutoResize(textareaRef)

  return (
    <TextCommon
      as="textarea"
      ref={textareaRef}
      className={classNames(cn('TextArea'), className)}
      {...rest}
    />
  )
}
