import { ButtonAddSmiles } from './ButtonAddSmiles'
import { cn } from './cn'
import { InputMessage } from './InputMessage'
import { UploadFile } from './UploadFile'
import { VoiceMessage } from './VoiceMessage'

interface FooterProps {

}

export function Footer(props: FooterProps) {
  return (
    <>
      <UploadFile />
      <InputMessage />
      <div className={cn('ButtonsBox')}>
        <ButtonAddSmiles />
        <VoiceMessage />
      </div>
    </>
  )
}
