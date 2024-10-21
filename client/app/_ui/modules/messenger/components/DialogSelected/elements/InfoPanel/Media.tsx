import { get, groupBy } from 'lodash'
import { useSelector } from 'react-redux'
import { ButtonDownload } from '@ui/common/ButtonDownload'
import { TabOption, TabPanel, Tabs, TabsList } from '@ui/common/Tabs'
import { MessengerSelectors } from '@ui/modules/messenger/store/selectors'
import { cn } from './cn'

export function Media() {
  const currentDialog = useSelector(MessengerSelectors.selectCurrentDialog)
  if (!currentDialog) return null
  // @ts-ignore
  const gropedMediaByType = groupBy(currentDialog.media, 'meta.type')

  // @ts-ignore
  const voices = currentDialog.voices || []
  // @ts-ignore
  const video = currentDialog.videos || []
  const audio = get(gropedMediaByType, 'audio', [])
  const image = get(gropedMediaByType, 'image', [])
  const other = get(gropedMediaByType, 'other', [])

  return (
    <div className={cn('Media')}>
      <Tabs contextProps={{ activeTab: 0 }}>
        <TabsList className={cn('MediaTabsList')}>
          <TabOption className={cn('MediaTab')} value={0} title="Фото" />
          <TabOption className={cn('MediaTab')} value={2} title="Аудио" />
          <TabOption className={cn('MediaTab')} value={3} title="Видео" />
          <TabOption className={cn('MediaTab')} value={1} title="Голосовые сообщения" />
          <TabOption className={cn('MediaTab')} value={4} title="Файлы" />
        </TabsList>
        <TabPanel className={cn('MediaTabPanel')} value={0}>
          {image.map(({ meta }) => (
            <img src={meta.src} alt={meta.name} style={{ maxHeight: 'auto', height: 'auto' }} />
          ))}
        </TabPanel>
        <TabPanel className={cn('MediaTabPanel')} value={1}>
          {voices.map(({ meta }) => (
            <audio key={meta.src} controls>
              <source src={meta.src} type={meta.mimeType} />
              Your browser does not support the audio element.
            </audio>
          ))}
        </TabPanel>
        <TabPanel className={cn('MediaTabPanel')} value={2}>
          {audio.map(({ meta }) => (
            <audio key={meta.src} controls>
              <source src={meta.src} type={meta.mimeType} />
              Your browser does not support the audio element.
            </audio>
          ))}
        </TabPanel>
        <TabPanel className={cn('MediaTabPanel')} value={3}>
          {video.map(({ meta }) => (
            <video controls>
              <source src={meta.src} type={meta.mimeType} />
              Your browser does not support the video element.
            </video>
          ))}
        </TabPanel>

        <TabPanel className={cn('MediaTabPanel')} value={4}>
          {other.map((data) => (
            <div className={cn('MediaContainerMediaOtherItem')}>
              <ButtonDownload file={data} />
            </div>
          ))}
        </TabPanel>
      </Tabs>
    </div>
  )
}
