import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { UserAboutType } from "@src/services/users/_interfaces";

@Entity({ comment: 'Общая информация о пользователе' })
export class UserAbout implements UserAboutType {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Место учебы' })
    study: string

    @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Место работы'})
    working: string

    @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Должность'})
    position: string

    @Column({ type: 'text', nullable: true, comment: 'Описание'})
    description: string

    @Column({ type: 'varchar', length: 100, nullable: true, comment: 'Фото баннера'})
    banner_image: string
}
