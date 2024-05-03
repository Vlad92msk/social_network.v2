import { makeCn } from '@utils/others'
import { IconBase } from 'app/_ui/base/IconBase'
import { ButtonCommon } from 'app/_ui/common/ButtonCommon'
import { TextCommon, TextPropsFontSize } from 'app/_ui/common/TextCommon'
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
        <ButtonCommon className={cn('ButtonChange')}>
          <TextCommon fs={buttonFontSize}>
            Моя музыка
          </TextCommon>
        </ButtonCommon>
        <ButtonCommon className={cn('ButtonChange')}>
          <TextCommon fs={buttonFontSize}>
            Мои видео
          </TextCommon>
        </ButtonCommon>
      </div>
      <div className={cn('SecondRow')}>
        <IconBase className={cn('Icon')} name="menu-list" />
        <IconBase className={cn('Icon')} name="play" />
        <IconBase className={cn('Icon')} name="sound" />
        <TextCommon fs="8">Проигрываемая дорожка</TextCommon>
      </div>
    </div>
  )
}
