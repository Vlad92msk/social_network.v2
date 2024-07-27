import { Text } from '@ui/common/Text'
import { cn } from '../cn'

interface InformationProps {
  information?: string
}

export function Information(props: InformationProps) {
  const { information } = props

  return (
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
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        I'm a frontend developer with over 3 years of experience in a major IT company.
        {' '}
        <br />
        <br />
        Experience:
        {' '}
        <br />
        {/* eslint-disable-next-line react/no-unescaped-entities */}
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
        {/* eslint-disable-next-line react/no-unescaped-entities */}
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
  )
}
