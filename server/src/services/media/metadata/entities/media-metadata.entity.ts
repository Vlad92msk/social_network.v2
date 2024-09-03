import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm'
import { MediaItemType } from '../interfaces/mediaItemType'
import { ApiProperty } from '@nestjs/swagger'

@Entity()
export class MediaMetadata {
    @ApiProperty({ description: 'Уникальный идентификатор метаданных' })
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ApiProperty({ description: 'Название файла' })
    @Column()
    name: string

    @ApiProperty({ description: 'Путь к файлу' })
    @Column()
    src: string

    @ApiProperty({ description: 'MIME-тип файла' })
    @Column()
    mimeType: string

    @ApiProperty({ description: 'Размер файла в байтах' })
    @Column('int')
    size: number

    @ApiProperty({ description: 'Дата последнего изменения файла' })
    @Column()
    lastModified: Date

    @ApiProperty({ description: 'Тип медиа-файла', enum: MediaItemType })
    @Column({
        type: 'enum',
        enum: MediaItemType,
    })
    type: MediaItemType

    @ApiProperty({ description: 'ID пользователя' })
    @Column()
    user_id: number

    @ApiProperty({ description: 'Дата загрузки файла' })
    @CreateDateColumn()
    date_upload: Date
}
