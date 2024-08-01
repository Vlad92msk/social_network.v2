import { useCreatePublicationCtxSelect } from '../CreatePublication'

export function AddedContent() {
  const voice = useCreatePublicationCtxSelect((ctx) => ctx.voice)

  if (!voice) return null
  return (
    <div>
      <audio src={URL.createObjectURL(voice)} controls />
    </div>
  )
}
