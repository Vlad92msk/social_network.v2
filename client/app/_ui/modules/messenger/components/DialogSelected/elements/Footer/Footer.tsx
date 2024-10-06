import { useProfile } from '@hooks'
import { CreatePublication } from '@ui/components/create-publication'
import { cn } from './cn'

interface FooterProps {

}

export function Footer(props: FooterProps) {
  const { profile } = useProfile()
  return (
    <CreatePublication
      className={cn('CreateMessage')}
      onSubmit={(data) => {
        console.log('Publication', data)
        // @ts-ignore
        // handleSubmit(data, profile?.user_info)
      }}
    />
  )
}
