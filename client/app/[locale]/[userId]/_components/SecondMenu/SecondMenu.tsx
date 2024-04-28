import { BaseIcon } from '@ui/base/BaseIcon'
import { CommonButton } from '@ui/common/CommonButton'
import { CommonText, TextPropsFontSize } from '@ui/common/CommonText/CommonText'
import { makeCn } from '@utils/others'
import style from './SecondMenu.module.scss'

const cn = makeCn('SecondMenu', style)

export interface SecondMenuProps {
  layoutVariant: string
}

const buttonFontSize: TextPropsFontSize = '10'

export function SecondMenu(props: SecondMenuProps) {
  const { layoutVariant } = props
  return (
    <div className={cn({ variant: layoutVariant })}>
      <div className={cn('MainRow')}>
        <CommonButton className={cn('ButtonChange')}>
          <CommonText fs={buttonFontSize}>
            Моя музыка
          </CommonText>
        </CommonButton>
        <CommonButton className={cn('ButtonChange')}>
          <CommonText fs={buttonFontSize}>
            Мои видео
          </CommonText>
        </CommonButton>
      </div>
      <div className={cn('SecondRow')}>
        <BaseIcon className={cn('Icon')} name="git" />
        <BaseIcon className={cn('Icon')} name="git" />
        <BaseIcon className={cn('Icon')} name="git" />
        <CommonText fs="8">Проигрываемая дорожка</CommonText>
      </div>
    </div>
  )
}
