<h1 align="center">
  My Social Network
</h1>

![Language](https://img.shields.io/badge/language-TypeScript-blue.svg)
![Frontend](https://img.shields.io/badge/frontend-Nextjs-0f70f3.svg)
![Backend](https://img.shields.io/badge/backend-Nestjs-e0224e.svg)
![ORM](https://img.shields.io/badge/ORM-TypeOrm-fb0902.svg)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791.svg)
![API](https://img.shields.io/badge/api-REST-e535ab.svg)


> This is my educational **Fullstack Web App** where I practice my skills and explore new technologies!

> Проект переписывался множество раз и я часто меняю/переписываю ранее написанный код.
> Много экспериментирую со структурой, подходами и т.д.

## Folder Structure

```
📦social_network
 ┣ 📁database
 ┣ 📁pgadmin
 ┣ 📁swagger (автогенерация методов из контроллеров)
 ┃
 ┣📁uploads (физическое хранение файлов загружаемых в систему из server)
 ┃  
 ┣ 📁client (старая версия с NextJS)
 ┣ 📁client_react (новая версия с React)
 ┃
 ┣ 📁server
 ┃
 ┣ 📄.env
 ┣ 📄.env.example
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
Пока что Докер не использую.
Для разработки использую Makefile -> start-dev

Currently, I'm working on the client side. 
I'll work on the server side later. 
What's already done on the server side was done a while ago.



#### Used Technologies:

| General    | <img src="./icons/typeScript.svg" width="50" height="50"> | <img src="./icons/Docker.svg" width="50" height="50"> | |                                                       |
|------------|-----------------------------------------------------------|-|-|-------------------------------------------------------|
| **Client** | <img src="./icons/nextLS.svg" width="50" height="50">         | <img src="./icons/rxjs.svg" width="50" height="50" alt='RxJS'> | <img src="./icons/sass.svg" alt="Sass" width="50" height="50"> |
| **Server** | <img src="./icons/nest.svg" width="50" height="50">          | <img src="./icons/typeorm.svg" width="50" height="50"> | <img src="./icons/postgresql.svg" width="50" height="50"> |
