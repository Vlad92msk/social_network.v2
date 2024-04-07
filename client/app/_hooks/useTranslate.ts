'use client'

import { useBooleanState } from '@hooks/useBooleanState'
import { getMessages } from '@utils/others'
import { get } from 'lodash'
import { useEffect, useState } from 'react'
import { useLocale } from './useLocale'

export const useTranslate = () => {
  const locale = useLocale()
  const [messages, setMessages] = useState({})
  const [isLoading, setTrueLoading, setFalseLoading] = useBooleanState(true)

  useEffect(() => {
    setTrueLoading(); // Начало загрузки
    (async () => {
      const m = await getMessages(locale)
      setMessages(m)
      setFalseLoading() // Завершение загрузки
    })()
  }, [locale, setFalseLoading, setTrueLoading])

  // Возвращение функции перевода и статуса загрузки
  return { translate: (key: string) => get(messages, key), isLoading }
}
