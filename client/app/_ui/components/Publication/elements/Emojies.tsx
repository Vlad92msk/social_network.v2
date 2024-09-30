import { ToggleReactions, ToggleReactionsProps } from '@ui/modules/toggle-reactions'
import { cn } from '../cn'

export function Emojies(props: ToggleReactionsProps) {
  return (
    <ToggleReactions className={cn('Emojies')} {...props} />
  )
}
