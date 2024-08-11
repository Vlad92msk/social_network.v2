<h1 align="center">
  My Social Network
</h1>

![Language](https://img.shields.io/badge/language-TypeScript-blue.svg)
![Frontend](https://img.shields.io/badge/frontend-Nextjs-0f70f3.svg)
![Backend](https://img.shields.io/badge/backend-Nestjs-e0224e.svg)
![ORM](https://img.shields.io/badge/ORM-TypeOrm-fb0902.svg)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791.svg)
![API](https://img.shields.io/badge/api-GraphQL-e535ab.svg)

[//]: # (![Testing]&#40;https://img.shields.io/badge/testing-Jest-954058.svg&#41;)

> This is my educational **Fullstack Web App** where I practice my skills and explore new technologies!

> Проект переписывался множество раз и я часто меняю/переписываю ранее написанный код.
> Много экспериментирую со структурой, подходами и т.д.

## Folder Structure

```
📦social_network
 ┣ 📁database
 ┣ 📁pgadmin
 ┣ 📁uploads (физическое хранение файлов)
 ┃ ┣📁audio
 ┃ ┃ ┗📁[user_id_{id}] (храним файлы конкретного пользователя)
 ┃ ┃  ┣ any.mp3
 ┃ ┃  ┣ any1.mp3
 ┃ ┃  ┣ any2.mp3
 ┃ ┃  ┗ ...
 ┃ ┃  
 ┃ ┣📁video
 ┃ ┣📁image
 ┃ ┗📁other
 ┃
 ┣ 📁server
 ┃  ┣📁src
 ┃  ┃  ┣📁config
 ┃  ┃  ┃   ┣ config.enum.ts
 ┃  ┃  ┃   ┣ main.config.ts
 ┃  ┃  ┃   ┣ mirate.config.ts
 ┃  ┃  ┃   ┣ orm.config.ts
 ┃  ┃  ┃   ┣ secrets.config.ts
 ┃  ┃  ┃   ┗ ...
 ┃  ┃  ┃      
 ┃  ┃  ┣📁services (микросервисы)
 ┃  ┃  ┃   ┃
 ┃  ┃  ┃   ┣📁media
 ┃  ┃  ┃   ┃    ┗📁info(информация о медиа-файле относительно пользователя - теги, связь с таблицей комментарией, реакции пользователей и т.д.)
 ┃  ┃  ┃   ┃    ┃ ┣📁args
 ┃  ┃  ┃   ┃    ┃ ┣📁decorators
 ┃  ┃  ┃   ┃    ┃ ┣📁entities
 ┃  ┃  ┃   ┃    ┃ ┣📁dto
 ┃  ┃  ┃   ┃    ┃ ┣📁interfaces
 ┃  ┃  ┃   ┃    ┃ ┣📁args
 ┃  ┃  ┃   ┃    ┃ ┣ info.controller.ts
 ┃  ┃  ┃   ┃    ┃ ┣ info.service.ts
 ┃  ┃  ┃   ┃    ┃ ┗ info.module.ts 
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┣📁storage (отвечает за физическое хранение/получение файлов, трансформацию из одного формата в другой и т.д. - в дальнейшем вместо этого может быть переход на aws)
 ┃  ┃  ┃   ┃    ┃ ┣📁args
 ┃  ┃  ┃   ┃    ┃ ┣📁decorators
 ┃  ┃  ┃   ┃    ┃ ┣📁entities
 ┃  ┃  ┃   ┃    ┃ ┣📁dto
 ┃  ┃  ┃   ┃    ┃ ┣📁interfaces
 ┃  ┃  ┃   ┃    ┃ ┣📁args
 ┃  ┃  ┃   ┃    ┃ ┣ storage.controller.ts
 ┃  ┃  ┃   ┃    ┃ ┣ storage.service.ts
 ┃  ┃  ┃   ┃    ┃ ┗ storage.module.ts 
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┗📁metadata (метаданные о медиа файлах (имя файла, путь к файлу, тип файла, дата загрузки и т.д.))
 ┃  ┃  ┃   ┃     ┣📁args
 ┃  ┃  ┃   ┃     ┣📁decorators
 ┃  ┃  ┃   ┃     ┣📁entities
 ┃  ┃  ┃   ┃     ┣📁dto
 ┃  ┃  ┃   ┃     ┣📁interfaces
 ┃  ┃  ┃   ┃     ┣📁args
 ┃  ┃  ┃   ┃     ┣ metadata.controller.ts
 ┃  ┃  ┃   ┃     ┣ metadata.service.ts
 ┃  ┃  ┃   ┃     ┗ metadata.module.ts
 ┃  ┃  ┃   ┃ 
 ┃  ┃  ┃   ┗ app.module.ts
 ┃  ┃  ┃
 ┃  ┃  ┣ 📁migrations
 ┃  ┃  ┃   ┗ ...
 ┃  ┃
 ┃  ┗ ...
 ┃
 ┣ 📄.env
 ┣ 📄Makefile
 ┗ 📄docker-compose.dev.yml
 ┗ 📄docker-compose.prod.yml

 ```

## Runs

DEV:

```
docker-compose -f docker-compose.dev.yml up --build
```

PROD:

```
docker-compose -f docker-compose.prod.yml up --build
```

STOP:

```
docker-compose -f docker-compose.yml down
```

Currently, I'm working on the client side. 
I'll work on the server side later. 
What's already done on the server side was done a while ago.



#### Used Technologies:

| General    | <img src="./icons/typeScript.svg" width="50" height="50"> | <img src="./icons/Docker.svg" width="50" height="50"> | |                                                       |
|------------|-----------------------------------------------------------|-|-|-------------------------------------------------------|
| **Client** | <img src="./icons/nextLS.svg" width="50" height="50">         | <img src="./icons/rxjs.svg" width="50" height="50" alt='RxJS'> | <img src="./icons/sass.svg" alt="Sass" width="50" height="50"> |
| **Server** | <img src="./icons/nest.svg" width="50" height="50">          | <img src="./icons/typeorm.svg" width="50" height="50"> | <img src="./icons/postgresql.svg" width="50" height="50"> |
