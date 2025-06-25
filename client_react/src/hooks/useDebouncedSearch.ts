import { useCallback, useEffect, useRef, useState } from 'react'
import { BehaviorSubject } from 'rxjs'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'

interface SearchInput {
  name?: string
  value?: string
}

interface UseDebouncedSearchProps {
  initialValue?: string
  onSearch: (value?: string, name?: string) => void
  debounceMs?: number
}

/**
 * Поиск с задержкой и проверкой на prevValue
 */
export const useDebouncedSearch = (props: UseDebouncedSearchProps) => {
  const { initialValue, onSearch, debounceMs = 300 } = props
  const [input, setInput] = useState(initialValue)
  const searchSubject = useRef(
    new BehaviorSubject<SearchInput>({
      name: '',
      value: initialValue,
    }),
  )

  useEffect(() => {
    const subscription = searchSubject.current
      .pipe(
        debounceTime(debounceMs),
        distinctUntilChanged((prev, curr) => prev.name === curr.name && prev.value === curr.value),
      )
      .subscribe(({ name, value }) => {
        onSearch(value, name)
      })

    return () => subscription.unsubscribe()
  }, [debounceMs])

  const handleChange = useCallback((value?: string, name?: string) => {
    setInput(value)
    searchSubject.current.next({ name, value })
  }, [])

  return {
    input,
    handleChange,
  }
}
