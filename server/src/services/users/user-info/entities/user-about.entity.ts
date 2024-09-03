import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm'
import { UserAboutType } from '@src/services/users/_interfaces'
import { ApiProperty } from "@nestjs/swagger";

@Entity({ comment: 'Общая информация о пользователе' })
export class UserAbout implements UserAboutType {
    @ApiProperty({ description: 'ID записи' })
    @PrimaryGeneratedColumn()
    id: number

    @ApiProperty({ description: 'Место учебы', required: false })
    @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Место учебы' })
    study: string

    @ApiProperty({ description: 'Место работы', required: false })
    @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Место работы'})
    working: string

    @ApiProperty({ description: 'Должность', required: false })
    @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Должность'})
    position: string

    @ApiProperty({ description: 'Описание', required: false })
    @Column({ type: 'text', nullable: true, comment: 'Описание'})
    description: string

    @ApiProperty({ description: 'URL фото баннера', required: false })
    @Column({ type: 'varchar', length: 200, nullable: true, comment: 'Фото баннера'})
    banner_image: string
}
