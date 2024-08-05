import { Entity, Column, PrimaryGeneratedColumn, } from 'typeorm';
import { UserProfileType } from "../interfaces";

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
}


// src:
//     config:
//         main.congig.ts
//         orm.congig.ts
//         ...
//     lib:
//         profile:
//             user:
//                 args:
//                     ...
//                 decorators:
//                     ...
//                 entities:
//                     userProfile.entity.ts
//                 inputs:
//                     ...
//                 interfaces:
//                     profile.ts
//                     index.ts
//                 user.module.ts
//                 user.service.ts
//
//     app.module.ts
//     migrations:
//         ...
//     utils:
//         ...
