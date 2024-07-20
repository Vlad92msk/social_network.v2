import { useEffect } from 'react'
import { useIsInView } from '@hooks'
import { usePublicationCtxSelect } from '../Publication'

interface UseUpdateDateReadProps {
  ref: React.RefObject<HTMLElement | null>;
  onRead?: (publicationId?: string) => void;
  dateRead?: Date | null;
}

export const useUpdateDateRead = ({
  ref,
  onRead,
  dateRead,
}: UseUpdateDateReadProps) => {
  const publicationId = usePublicationCtxSelect((store) => store.id)
  const isInView = useIsInView(ref)

  useEffect(() => {
    if (onRead && isInView && !dateRead) {
      onRead(publicationId)
    }
  }, [dateRead, isInView, onRead, publicationId])
}
