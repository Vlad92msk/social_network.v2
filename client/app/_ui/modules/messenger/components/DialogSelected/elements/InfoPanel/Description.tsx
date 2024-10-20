
import { Image } from '@ui/common/Image'
import { Text } from '@ui/common/Text'
import { cn } from './cn'


export const Description = () => {


  return (
    <div className={cn('Description')}>
      <div className={cn('Image')}>
        <Image alt={''} width={20} height={20} />
      </div>
      <Text weight={'bold'}>Title</Text>
      <div className={cn('ParticipantsOnline')}>
        <Text>{`${27} участников`}</Text>
        <Text>{`${27} в сети`}</Text>
      </div>
      <div className={cn('ActionButtons')}>
        <button>
          Добавить
        </button>
      </div>
      <div className={cn('Information')}>
        <Text>Description</Text>
      </div>
    </div>
  )
}
