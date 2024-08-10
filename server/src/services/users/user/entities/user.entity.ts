import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, OneToOne, JoinColumn, } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UserAbout } from "./userAbout.entity";
import { UserAboutType, UserInfoType } from "../../_interfaces";

@Entity({ comment: 'Профиль пользователя' })
export class UserInfo implements UserInfoType {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: false, type: 'varchar', length: 40, comment: 'Публичный ID', unique: true })
    public_id: string

    @Column({ nullable: false, type: 'varchar', length: 70, comment: 'Имя' })
    name: string

    @Column({ nullable: true, type: 'varchar', length: 100, comment: 'Фото профиля' })
    profile_image: string


    //__________________
    // Связи

    @OneToOne(type => UserAbout, { cascade: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    about_info: UserAboutType

    //__________________
    // Автогенерация

    @BeforeInsert()
    generateName() {
        this.name = `Rename_user_${uuidv4()}`
    }

    @BeforeInsert()
    generatePublicId() {
        this.public_id = uuidv4();
    }
}
