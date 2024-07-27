import dynamic from 'next/dynamic'

export const Emoji = dynamic(
  () => import('emoji-picker-react'),
  { ssr: false },
)

export enum EmojiStyle {
  NATIVE = 'native',
  APPLE = 'apple',
  TWITTER = 'twitter',
  GOOGLE = 'google',
  FACEBOOK = 'facebook'
}
export enum Theme {
  DARK = 'dark',
  LIGHT = 'light',
  AUTO = 'auto'
}
