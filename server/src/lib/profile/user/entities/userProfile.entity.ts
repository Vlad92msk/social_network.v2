import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, } from 'typeorm';
import { UserProfileType } from "../interfaces";
import { v4 as uuidv4 } from 'uuid';

@Entity({ comment: 'Профиль пользователя' })
export class UserProfile implements UserProfileType {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    uuid: string

    @Column({ type: 'varchar', length: 100, nullable: false })
    email: string;

    // @Column()
    // userInfo: any
    //
    @Column({ type: 'text', array: true, default: [] })
    dialogsIds: string[];

    @BeforeInsert()
    generateUuid() {
        this.uuid = uuidv4();
    }
}
