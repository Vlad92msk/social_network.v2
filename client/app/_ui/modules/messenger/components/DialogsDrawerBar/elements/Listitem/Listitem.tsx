import { Image } from '@ui/common/Image'
import { Text } from '@ui/common/Text'
import { makeCn } from '@utils/others'
import style from './Listitem.module.scss'

export const cn = makeCn('Listitem', style)

interface SwitcherDialogType {
  img?: string
  contactName?: string
  lastContactName?: string
  textMessage?: string
  actions?: React.ReactNode
}

export function Listitem(props: SwitcherDialogType) {
  const { img, lastContactName, contactName, textMessage, actions } = props
  return (
    <div className={cn()}>
      <div className={cn('ImgContainer')}>
        <Image src={img} alt="1" width="50" height="50" />
      </div>
      <div className={cn('ContentWrapper')}>
        {contactName && (<Text className={cn('Name')} fs="12" textElipsis>{contactName}</Text>) }
        {lastContactName && (<Text className={cn('LastContactName')} fs="12" textElipsis>{lastContactName}</Text>) }
        {textMessage && (<Text className={cn('LastMessage')} fs="12" textElipsis>{textMessage}</Text>)}
      </div>
      {actions && (
        <div className={cn('HoverActions')}>
          {actions}
        </div>
      )}
    </div>
  )
}
