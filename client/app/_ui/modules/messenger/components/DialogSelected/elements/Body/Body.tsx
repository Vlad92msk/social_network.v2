import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'
import { useSelector } from 'react-redux'
import { Spinner } from '@ui/common/Spinner'
import { cn } from './cn'
import { Message } from './Messege'
import { messagesApi } from '../../../../../../../../store/api'
import { MessengerSelectors } from '../../../../store/selectors'

export function Body() {
  const dialogId = useSelector(MessengerSelectors.selectCurrentDialogId)
  const [cursor, setCursor] = useState<string | undefined>(undefined)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { ref: loaderRef, inView } = useInView({ threshold: 0.5 })

  const { data: messagesData, isLoading, isFetching } = messagesApi.useFindAllQuery(
    { dialog_id: dialogId, cursor, limit: 10 },
    {
      skip: !dialogId,
      refetchOnMountOrArgChange: true,
    },
  )

  const clearLoadingTimeout = useCallback(() => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
  }, [])

  const loadMore = useCallback(() => {
    if (messagesData?.has_more && !isFetching && !isLoadingMore) {
      setIsLoadingMore(true)
      setCursor(messagesData.cursor)

      clearLoadingTimeout()

      loadingTimeoutRef.current = setTimeout(() => {
        setIsLoadingMore(false)
      }, 1000) // Задержка в 1 секунду
    }
  }, [messagesData, isFetching, isLoadingMore, clearLoadingTimeout])

  useEffect(() => {
    if (inView && !isLoadingMore) {
      loadMore()
    }
  }, [inView, loadMore, isLoadingMore])

  useEffect(() => () => clearLoadingTimeout(), [clearLoadingTimeout])

  useEffect(() => {
    // Сбрасываем cursor при смене диалога
    setCursor(undefined)
    return () => clearLoadingTimeout()
  }, [dialogId, clearLoadingTimeout])

  const messages = useMemo(() => messagesData?.data || [], [messagesData])
  const hasMore = useMemo(() => messagesData?.has_more || false, [messagesData])

  return (
    <div className={cn()}>
      {isLoading ? (
        <Spinner />
      ) : (
        <>
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}
          {hasMore && (
            <div ref={loaderRef}>
              {isFetching ? <Spinner /> : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
