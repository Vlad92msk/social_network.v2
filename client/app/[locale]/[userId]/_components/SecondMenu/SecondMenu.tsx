import { makeCn } from '@utils/others'
import { Icon } from 'app/_ui/common/Icon'
import { Button } from 'app/_ui/common/Button'
import { Text, TextPropsFontSize } from 'app/_ui/common/Text'
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
        <Button className={cn('ButtonChange')}>
          <Text fs={buttonFontSize}>
            Моя музыка
          </Text>
        </Button>
        <Button className={cn('ButtonChange')}>
          <Text fs={buttonFontSize}>
            Мои видео
          </Text>
        </Button>
      </div>
      <div className={cn('SecondRow')}>
        <Icon className={cn('Icon')} name="menu-list" />
        <Icon className={cn('Icon')} name="play" />
        <Icon className={cn('Icon')} name="sound" />
        <Text fs="8">Проигрываемая дорожка</Text>
      </div>
    </div>
  )
}
