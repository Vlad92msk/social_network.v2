import { Image } from '@ui/common/Image'
import { Text } from '@ui/common/Text'
import { cn } from '../cn'

export function Banner() {
  return (
    <div className={cn('Banner')}>
      <div className={cn('BannerBck')}>
        <Image alt="bunner" src="base/bunner" width={400} height={200} />
      </div>
      <div className={cn('MyPhoto')}>
        <Image alt="bunner" src="base/me" width={70} height={70} />
      </div>
      <div className={cn('ContactsList')}>
        <Text className={cn('UsersPlus')} fs="10">+99</Text>
        {[1, 23, 4].map((el, index) => (
          <div
            key={el}
            className={cn('ContactItemBox')}
            style={{
              zIndex: 3 - (index + 1),
              transform: `translateX(${10 * (3 - (index + 1))}px)`,
            }}
          >
            <Image src="base/me" width={40} height={40} alt={el.toString()} />
          </div>
        ))}
      </div>
    </div>
  )
}
