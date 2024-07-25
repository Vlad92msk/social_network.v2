'use client'

import { useProfile } from '@hooks'
import { Icon } from '@ui/common/Icon'
import { Image } from '@ui/common/Image'
import { Text } from '@ui/common/Text'
import { makeCn, rem } from '@utils/others'
import style from './AboutMe.module.scss'

const cn = makeCn('AboutMe', style)

interface AboutMeProps {
}

export function AboutMe(props: AboutMeProps) {
  const { } = props

  const { profile } = useProfile()

  return (
    <div className={cn()}>
      <div className={cn('Bunner')}>
        <div className={cn('BannerBck')}>
          <Image alt="bunner" src="base/bunner" width={400} height={200} />
        </div>
        <div className={cn('MyPhoto')}>
          <Image alt="bunner" src="base/me" width={70} height={70} />
        </div>
        <div className={cn('ContactsList')}>
          <Text className={cn('UsersPlus')} fs="10">+99</Text>
          {[1, 23, 4].map((el, index) => (
            <div
              key={el}
              className={cn('ContactItemBox')}
              style={{
                zIndex: 3 - (index + 1),
                transform: `translateX(${10 * (3 - (index + 1))}px)`,
              }}
            >
              <Image src="base/me" width={40} height={40} alt={el.toString()} />
            </div>
          ))}
        </div>
      </div>
      <div className={cn('Name')}>
        <Text weight="bold" fs="18">Фирсов Влад</Text>
      </div>
      <div className={cn('Univercity')}>
        <Text weight="bold">МГПУ</Text>
        <Icon name="studying-university" />
      </div>
      <div className={cn('Position')}>
        <Text weight="bold">Frontend-developer</Text>
      </div>
      <div className={cn('Company')}>
        <Text weight="bold">ООО "42"</Text>
        <Icon name="job-in-company" />
      </div>
      <div className={cn('Information')}>
        <Text fs="16" lineHeight={30}>
          Привет!
          {' '}
          <br />
          Я - frontend разработчик с опытом работы в крупной IT-компании более 3 лет.
          {' '}
          <br />
          <br />
          Опыт:
          {' '}
          <br />
          В данный момент работаю в компании разрабатывающей сервисы для работы учителей(планирование/выдача/проверка домашних заданий, контрольных работ, мероприятий и т.д).
          {' '}
          <br />
          <br />
          Увлечения:
          {' '}
          <br />
          В свободное время экспериментирую с новыми технологиями и подходами в своем пет-проекте:
          {' '}
          <br />
          frontend: NextJS и ApolloClient
          {' '}
          <br />
          backend - NestJS, GraphQL, Postgres, TypeORM
          {' '}
          <br />
          Этот проект помогает мне расширять свои знания и дополнительно практиковаться.
          {' '}
          <br />
          <br />
          Переезд:
          {' '}
          <br />
          Проживаю в Республике Казахстан.
          {' '}
          <br />
          Рассматриваю возможности переезда.
          {' '}
          <br />
          <br />
          Кратко:
          {' '}
          <br />
          ✅ 3+ года опыта в качестве Frontend разработчика в Enterprise проекте
          {' '}
          <br />
          ✅ Опыт работы в команде ~20 человек
          {' '}
          <br />
          ✅ Опыт планирования и распределения задач внутри команды разработчиков
          {' '}
          <br />
          ✅ Основной стэк на работе: React, Typescript, Redux-observable, RxJS
          {' '}
          <br />
          ✅ Готов к переезду
          {' '}
          <br />
          _____________________________
          {' '}
          <br />
          <br />
          <br />
          Hello!
          {' '}
          <br />
          I'm a frontend developer with over 3 years of experience in a major IT company.
          {' '}
          <br />
          <br />
          Experience:
          {' '}
          <br />
          Currently, I'm working in a company that develops services for educators, including planning, assigning, and assessing homework, tests, events, and more.
          {' '}
          <br />
          <br />
          Interests:
          {' '}
          <br />
          In my free time, I experiment with new technologies and approaches in my pet project:
          {' '}
          <br />
          Frontend: NextJS and ApolloClient
          {' '}
          <br />
          Backend: NestJS, GraphQL, Postgres, TypeORM
          {' '}
          <br />
          This project helps me expand my knowledge and provides additional practice.
          {' '}
          <br />
          <br />
          Relocation:
          {' '}
          <br />
          Iiving in the Republic of Kazakhstan.
          {' '}
          <br />
          I'm considering possibilities for relocation.
          {' '}
          <br />
          <br />
          About me:
          {' '}
          <br />
          ✅ 3+ years of experience as a Frontend developer in an Enterprise project
          {' '}
          <br />
          ✅ Experience working in a team of around 20 people
          {' '}
          <br />
          ✅ Experience in task planning and distribution within the development team
          {' '}
          <br />
          ✅ Primary stack at work: React, Typescript, Redux-observable, RxJS
          {' '}
          <br />
          ✅ Ready for relocation
          {' '}
          <br />
        </Text>
      </div>
    </div>
  )
}
