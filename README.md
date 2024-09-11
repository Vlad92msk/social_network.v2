<h1 align="center">
  My Social Network
</h1>

![Language](https://img.shields.io/badge/language-TypeScript-blue.svg)
![Frontend](https://img.shields.io/badge/frontend-Nextjs-0f70f3.svg)
![Backend](https://img.shields.io/badge/backend-Nestjs-e0224e.svg)
![ORM](https://img.shields.io/badge/ORM-TypeOrm-fb0902.svg)
![Database](https://img.shields.io/badge/database-PostgreSQL-336791.svg)
![API](https://img.shields.io/badge/api-REST-e535ab.svg)

[//]: # (![Testing]&#40;https://img.shields.io/badge/testing-Jest-954058.svg&#41;)

> This is my educational **Fullstack Web App** where I practice my skills and explore new technologies!

> Проект переписывался множество раз и я часто меняю/переписываю ранее написанный код.
> Много экспериментирую со структурой, подходами и т.д.

## Folder Structure

```
📦social_network
 ┣ 📁database
 ┣ 📁pgadmin
 ┣ 📁swagger (автогенерация методов из контроллеров)
 ┃  ┣ 📁comments
 ┃  ┃    ┣ 📄api-client-comments.ts
 ┃  ┃    ┣ 📄interfaces-comments.ts
 ┃  ┃    ┗ 📄swagger-comments.yaml
 ┃  ┣📁user-info
 ┃  ┣📁messages
 ┃  ┣📁posts
 ┃  ┗...
 ┃
 ┣📁uploads (физическое хранение файлов загружаемых в систему из server)
 ┃  ┣📁audio
 ┃  ┃  ┗📁[user_id_{id}] (храним файлы конкретного пользователя)
 ┃  ┃  ┃  ┣ any.mp3
 ┃  ┃  ┃  ┣ any1.mp3
 ┃  ┃  ┃  ┣ any2.mp3
 ┃  ┃  ┃  ┗ ...
 ┃  ┃  ┗ ...
 ┃  ┣ 📁image
 ┃  ┣ 📁video
 ┃  ┗ 📁other
 ┃  
 ┣ 📁client
 ┃  ┣ 📁node_modules
 ┃  ┣ 📁app
 ┃  ┃  ┣ 📁[locale]
 ┃  ┃  ┃  ┣ 📁components
 ┃  ┃  ┃  ┣ 📁signin
 ┃  ┃  ┃  ┣ 📁[userId]
 ┃  ┃  ┃  ┃  ┗ 📁...
 ┃  ┃  ┃  ┃
 ┃  ┃  ┃  ┗ 📁page.tsx
 ┃  ┃  ┃ 
 ┃  ┃  ┣ 📁_configs
 ┃  ┃  ┣ 📁_store (RTK)
 ┃  ┃  ┃  ┣ 📁api
 ┃  ┃  ┃  ┃ ┣ 📁createdApi (перенесенные вручную результаты генерации из generated - пока что так - потом подумаю как можно сделать чтобы использовать только генерацию)
 ┃  ┃  ┃  ┃ ┗ 📁instance (инстансы классов для АПИ типа export const commentsApiInstance = new CommentsApi() и т.д)
 ┃  ┃  ┃  ┃ 
 ┃  ┃  ┃  ┣ 📁generated (сгенерированные файлы типа export const commentsApi = createApi({...}))
 ┃  ┃  ┃  ┣ 📁rxUtils (утилиты для эффектов в redux-observable)
 ┃  ┃  ┃  ┣ 📁utils (обычне утилиты для эффектов но которые врятли еще где-то будут использоваться)
 ┃  ┃  ┃  ┗ ...
 ┃  ┃  ┃
 ┃  ┃  ┣ 📁_services
 ┃  ┃  ┣ 📁_utils
 ┃  ┃  ┣ 📁api
 ┃  ┃  ┣ 📁_ui
 ┃  ┃  ┃  ┣ 📁base (базовые компоненты/реэкспорт из библиотек - не зависят от дизайна проекта, просто функционал)
 ┃  ┃  ┃  ┣ 📁common (комопненты для текущего проекта - учитывают особенности дизайна)
 ┃  ┃  ┃  ┣ 📁сomponents (отдельные комопненты которые могут быть переиспользованы в любых частях приложения)
 ┃  ┃  ┃  ┣ 📁modules
 ┃  ┃  ┃  ┃ ┣ 📁comments (показывает комментарии к чему-либо)
 ┃  ┃  ┃  ┃ ┣ 📁messenger (чат типа telegram/whatsap)
 ┃  ┃  ┃  ┃ ┣ 📁post (Посты)
 ┃  ┃  ┃  ┃ ┗ ...
 ┃  ┃  ┃  ┃ 
 ┃  ┃  ┃  ┗ 📁styles
 ┃  ┃  ┃    ┣ 📁templates (css-шаблоны)
 ┃  ┃  ┃    ┣ 📁variables (css-переменые)
 ┃  ┃  ┃    ┣ 📄_index.scss
 ┃  ┃  ┃    ┣ 📄app.scss (отдельные css-переменые для всего проекта)
 ┃  ┃  ┃    ┣ 📄base.scss (стили по умолчанию)
 ┃  ┃  ┃    ┣ 📄colors.scss
 ┃  ┃  ┃    ┣ 📄fonts.scss
 ┃  ┃  ┃    ┣ 📄funcions.scss
 ┃  ┃  ┃    ┣ 📄for_components.scss (для импорта в компоненты)
 ┃  ┃  ┃    ┗ 📄mixins.scss
 ┃  ┃  ┃ 
 ┃  ┃  ┣ 📄defauilt-tags.tsx
 ┃  ┃  ┣ 📄global-error.tsx
 ┃  ┃  ┣ 📄head.tsx
 ┃  ┃  ┣ 📄layout.tsx
 ┃  ┃  ┣ 📄not-found.tsx
 ┃  ┃  ┣ 📄loading.tsx
 ┃  ┃  ┗ 📄page.tsx
 ┃  ┃   
 ┃  ┃   
 ┃  ┣ 📁middlwares
 ┃  ┃  ┣ 📄authMiddleware.ts
 ┃  ┃  ┣ 📄intlMiddleware.ts
 ┃  ┃  ┣ 📄variables.ts
 ┃  ┃  ┗ 📄utils.ts
 ┃  ┃ 
 ┃  ┣ 📁shared
 ┃  ┃  ┣ 📁hooks
 ┃  ┃  ┣ 📁types
 ┃  ┃  ┗ 📁utils
 ┃  ┃ 
 ┃  ┣  📁translations
 ┃  ┃  ┣ 📄en.json
 ┃  ┃  ┣ 📄ru.json
 ┃  ┃  ┗ 📁...
 ┃  ┃ 
 ┃  ┣ 📁public
 ┃  ┃  ┣ 📁favicon
 ┃  ┃  ┣ 📁fonts
 ┃  ┃  ┣ 📁icons
 ┃  ┃  ┣ 📁images
 ┃  ┃  ┗ 📁videos
 ┃  ┃  
 ┃  ┣ 📄.dockerignore
 ┃  ┣ 📄public
 ┃  ┣ 📄package.json
 ┃  ┗ 📄next.config.js
 ┃  ┗ ...
 ┃
 ┣ 📁server
 ┃  ┣📁node_modules
 ┃  ┣📄.dockerignore
 ┃  ┣📄package.json
 ┃  ┃
 ┃  ┣📁src
 ┃  ┃  ┣📁config
 ┃  ┃  ┃   ┣ config.enum.ts
 ┃  ┃  ┃   ┣ main.config.ts
 ┃  ┃  ┃   ┣ mirate.config.ts
 ┃  ┃  ┃   ┣ orm.config.ts
 ┃  ┃  ┃   ┣ secrets.config.ts
 ┃  ┃  ┃   ┗ ...
 ┃  ┃  ┃
 ┃  ┃  ┣📁uploads (физическое хранение файлов)
 ┃  ┃  ┃  ┣📁audio
 ┃  ┃  ┃  ┃  ┗📁[user_id_{id}] (храним файлы конкретного пользователя)
 ┃  ┃  ┃  ┃    ┣ any.mp3
 ┃  ┃  ┃  ┃    ┣ any1.mp3
 ┃  ┃  ┃  ┃    ┣ any2.mp3
 ┃  ┃  ┃  ┃    ┗ ...
 ┃  ┃  ┃  ┃    
 ┃  ┃  ┃  ┣📁video
 ┃  ┃  ┃  ┣📁image
 ┃  ┃  ┃  ┗📁other
 ┃  ┃  ┃    
 ┃  ┃  ┃      
 ┃  ┃  ┣📁services (микросервисы)
 ┃  ┃  ┃   ┣📁profile
 ┃  ┃  ┃   ┃  ┗📁info
 ┃  ┃  ┃   ┃    ┣📁args
 ┃  ┃  ┃   ┃    ┃  ┣ any.args.ts 
 ┃  ┃  ┃   ┃    ┃  ┗ ...
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┣📁decorators
 ┃  ┃  ┃   ┃    ┃  ┣ any.args.ts 
 ┃  ┃  ┃   ┃    ┃  ┗ ...
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┣📁entities
 ┃  ┃  ┃   ┃    ┃  ┣ profileInfo.entity.ts 
 ┃  ┃  ┃   ┃    ┃  ┣ user.entity.ts 
 ┃  ┃  ┃   ┃    ┃  ┗ ...
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┣📁inputs
 ┃  ┃  ┃   ┃    ┃  ┣ profileInfo.inputs.ts 
 ┃  ┃  ┃   ┃    ┃  ┗ ...
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┣📁interfaces
 ┃  ┃  ┃   ┃    ┃  ┣ profileInfo.ts 
 ┃  ┃  ┃   ┃    ┃  ┣ userInfo.ts 
 ┃  ┃  ┃   ┃    ┃  ┗ ...
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┣📁args
 ┃  ┃  ┃   ┃    ┃  ┣ any.args.ts 
 ┃  ┃  ┃   ┃    ┃  ┗ ...
 ┃  ┃  ┃   ┃    ┃    
 ┃  ┃  ┃   ┃    ┣ info.controller.ts
 ┃  ┃  ┃   ┃    ┣ info.service.ts
 ┃  ┃  ┃   ┃    ┗ info.module.ts
 ┃  ┃  ┃   ┃  
 ┃  ┃  ┃   ┣📁comments
 ┃  ┃  ┃   ┃    ┗📁comments
 ┃  ┃  ┃   ┃     ┣📁dto
 ┃  ┃  ┃   ┃     ┣📁decorators
 ┃  ┃  ┃   ┃     ┣📁entities
 ┃  ┃  ┃   ┃     ┣📁interfaces
 ┃  ┃  ┃   ┃     ┣ comments.controller.ts
 ┃  ┃  ┃   ┃     ┣ comments.service.ts
 ┃  ┃  ┃   ┃     ┗ comments.module.ts 
 ┃  ┃  ┃   ┃ 
 ┃  ┃  ┃   ┣📁posts
 ┃  ┃  ┃   ┃    ┗📁posts
 ┃  ┃  ┃   ┃     ┣📁decorators
 ┃  ┃  ┃   ┃     ┣📁entities
 ┃  ┃  ┃   ┃     ┣📁dto
 ┃  ┃  ┃   ┃     ┣📁interfaces
 ┃  ┃  ┃   ┃     ┣ posts.controller.ts
 ┃  ┃  ┃   ┃     ┣ posts.service.ts
 ┃  ┃  ┃   ┃     ┗ posts.module.ts 
 ┃  ┃  ┃   ┃
 ┃  ┃  ┃   ┣📁media
 ┃  ┃  ┃   ┃    ┗📁info(информация о медиа-файле относительно пользователя - теги, связь с таблицей комментарией, реакции пользователей и т.д.)
 ┃  ┃  ┃   ┃    ┃ ┣📁decorators
 ┃  ┃  ┃   ┃    ┃ ┣📁entities
 ┃  ┃  ┃   ┃    ┃ ┣📁dto
 ┃  ┃  ┃   ┃    ┃ ┣📁interfaces
 ┃  ┃  ┃   ┃    ┃ ┣ info.controller.ts
 ┃  ┃  ┃   ┃    ┃ ┣ info.service.ts
 ┃  ┃  ┃   ┃    ┃ ┗ info.module.ts 
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┣📁storage (отвечает за физическое хранение/получение файлов, трансформацию из одного формата в другой и т.д. - в дальнейшем вместо этого может быть переход на aws)
 ┃  ┃  ┃   ┃    ┃ ┣📁decorators
 ┃  ┃  ┃   ┃    ┃ ┣📁entities
 ┃  ┃  ┃   ┃    ┃ ┣📁dto
 ┃  ┃  ┃   ┃    ┃ ┣📁interfaces
 ┃  ┃  ┃   ┃    ┃ ┣ storage.controller.ts
 ┃  ┃  ┃   ┃    ┃ ┣ storage.service.ts
 ┃  ┃  ┃   ┃    ┃ ┗ storage.module.ts 
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┗📁metadata (метаданные о медиа файлах (имя файла, путь к файлу, тип файла, дата загрузки и т.д.))
 ┃  ┃  ┃   ┃     ┣📁decorators
 ┃  ┃  ┃   ┃     ┣📁entities
 ┃  ┃  ┃   ┃     ┣📁dto
 ┃  ┃  ┃   ┃     ┣📁interfaces
 ┃  ┃  ┃   ┃     ┣ metadata.controller.ts
 ┃  ┃  ┃   ┃     ┣ metadata.service.ts
 ┃  ┃  ┃   ┃     ┗ metadata.module.ts
 ┃  ┃  ┃   ┃
 ┃  ┃  ┃   ┣📁dialogs (список чатов)
 ┃  ┃  ┃   ┃    ┗📁dialog
 ┃  ┃  ┃   ┃     ┣📁decorators
 ┃  ┃  ┃   ┃     ┣📁entities
 ┃  ┃  ┃   ┃     ┣📁dto
 ┃  ┃  ┃   ┃     ┣📁interfaces
 ┃  ┃  ┃   ┃     ┃  ┣ dialog.ts 
 ┃  ┃  ┃   ┃     ┃  ┣ dialogShort.ts 
 ┃  ┃  ┃   ┃     ┃  ┗ ... 
 ┃  ┃  ┃   ┃     ┣ dialog.controller.ts
 ┃  ┃  ┃   ┃     ┣ dialog.service.ts
 ┃  ┃  ┃   ┃     ┗ dialog.module.ts
 ┃  ┃  ┃   ┃ 
 ┃  ┃  ┃   ┗ app.module.ts
 ┃  ┃  ┃
 ┃  ┃  ┣ 📁migrations
 ┃  ┃  ┃   ┗ ...
 ┃  ┃  ┃
 ┃  ┃  ┣ 📁utils
 ┃  ┃      ┗ ...
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
