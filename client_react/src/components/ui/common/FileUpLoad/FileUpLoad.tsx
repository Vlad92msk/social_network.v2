import { useBooleanState, AddedFile, availableFormats, GroupedFiles, groupFiles, MaterialAttachProps, useMaterialsAttach } from '@hooks'
import { classNames, makeCn } from '@utils'
import React, { useCallback, useEffect, useId } from 'react'
import { Icon, IconName } from '../../icon'
import { Button } from '../Button'
import { Modal } from '../Modal'
import styles from './FileUpLoad.module.scss'

const cn = makeCn('FileUpLoad', styles)

type FileUpLoadProps = {
  className?: string
  icon?: IconName
  buttonElement?: React.ReactElement
  onApply?: (files: AddedFile[]) => void
  onApplyWithGroup?: (files: GroupedFiles) => void
  disabled?: boolean
  availableTypes?: MaterialAttachProps
  isConfirm?: boolean
  isSingleChoice?: boolean
}

export function FileUpLoad(props: FileUpLoadProps) {
  const {
    className,
    icon,
    disabled,
    isConfirm,
    isSingleChoice,
    buttonElement,
    availableTypes: { availableTypes, maxFileSize } = {
      availableTypes: availableFormats,
      maxFileSize: '1mb',
    },
    onApply,
    onApplyWithGroup,
  } = props

  const inputId = useId()
  const [addedFiles, handleAddFiles, setAddedFiles] = useMaterialsAttach({
    availableTypes, maxFileSize,
  })

  const handleAttach = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    handleAddFiles(event)
    event.target.value = '' // Очищаем значение input
  }, [handleAddFiles])

  const removeAttach = useCallback((attachName: string) => {
    setAddedFiles((prev) => prev.filter(({ name }) => name !== attachName))
  }, [setAddedFiles])

  /**
   * Модалка предпросмотра материалов
   */
  const [isOpenPevFiles, openPrevFiles, closePrevFiles] = useBooleanState(false)
  useEffect(() => {
    if (addedFiles.length) {
      // Открывает модалку если добавлен материал
      openPrevFiles()
    } else {
      // Закрывает модалку если не осталось материалов
      closePrevFiles()
    }
  }, [addedFiles, closePrevFiles, openPrevFiles])

  const applyAttachments = useCallback(() => {
    onApplyWithGroup?.(groupFiles(addedFiles))
    onApply?.(addedFiles)
    setAddedFiles([])
  }, [addedFiles, onApply, onApplyWithGroup, setAddedFiles])

  /**
   * Если не нужно вызывать модалку с подтверждением - просто добавляет файлы
   */
  useEffect(() => {
    if (!isConfirm && addedFiles.length) {
      setTimeout(() => applyAttachments(), 500)
    }
  }, [isConfirm, addedFiles, applyAttachments])

  return (
    <>
      <div className={classNames(cn(), className)}>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label className={cn('AddFile', { disabled })} htmlFor={inputId}>
          {icon && (
            <Icon name={icon} fill="grey" />
          )}
          {buttonElement}
          <input
            className={cn('FileInput')}
            id={inputId}
            onInput={handleAttach}
            multiple={!isSingleChoice}
            accept={availableTypes.join(',')}
            type="file"
          />
        </label>
      </div>
      <Modal
        isOpen={Boolean(isOpenPevFiles && isConfirm)}
        contentClassName={cn('Content')}
      >
        <div className={cn('ApplyAttachments')}>
          {addedFiles.map(({
            name,
            src,
          }) => (
            <div key={name} className={cn('ApplyFile')}>
              <div className={cn('ImgWrapper')}>
                <img className={cn('Img')} src={src} alt={name} />
              </div>
              <Button className={cn('ButtonClose')} onClick={() => removeAttach(name)}>
                <Icon name="close" />
              </Button>
            </div>
          ))}
        </div>
        <Button className={cn('ButtonSubmit')} onClick={applyAttachments}>
          Подтвердить
        </Button>
      </Modal>
    </>
  )
}
