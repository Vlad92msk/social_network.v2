import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useSelector } from 'react-redux'
import { Locale } from '@middlewares/variables'
import { classNames } from '@utils/others'
import { Icon } from 'app/_ui/common/Icon'
import { cn } from './cn'
import { MessengerSelectors } from '../../../../store/selectors'

interface CallButtonsProps {
  className?: string
}

export function CallButtons(props: CallButtonsProps) {
  const { className } = props
  const currentDialog = useSelector(MessengerSelectors.selectCurrentDialog)
  const activeConference = useSelector(MessengerSelectors.selectActiveConference)
  const { locale } = useParams<{locale: Locale, userId: string}>()

  return (
    <div className={classNames(cn('CallButtons'), className)}>
      <Link
        className={cn('CallButton', { active: currentDialog && activeConference[currentDialog?.id] })}
        href={`/${locale}/conference/${currentDialog?.id}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <Icon name="video-camera" />
      </Link>
    </div>
  )
}
