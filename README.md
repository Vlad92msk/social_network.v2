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
 ┃  ┃  ┃   ┃     ┣📁args
 ┃  ┃  ┃   ┃     ┣📁decorators
 ┃  ┃  ┃   ┃     ┣📁entities
 ┃  ┃  ┃   ┃     ┣📁inputs
 ┃  ┃  ┃   ┃     ┣📁interfaces
 ┃  ┃  ┃   ┃     ┣📁args
 ┃  ┃  ┃   ┃     ┣ comments.controller.ts
 ┃  ┃  ┃   ┃     ┣ comments.service.ts
 ┃  ┃  ┃   ┃     ┗ comments.module.ts 
 ┃  ┃  ┃   ┃ 
 ┃  ┃  ┃   ┣📁posts
 ┃  ┃  ┃   ┃    ┗📁posts
 ┃  ┃  ┃   ┃     ┣📁args
 ┃  ┃  ┃   ┃     ┣📁decorators
 ┃  ┃  ┃   ┃     ┣📁entities
 ┃  ┃  ┃   ┃     ┣📁inputs
 ┃  ┃  ┃   ┃     ┣📁interfaces
 ┃  ┃  ┃   ┃     ┣📁args
 ┃  ┃  ┃   ┃     ┣ posts.controller.ts
 ┃  ┃  ┃   ┃     ┣ posts.service.ts
 ┃  ┃  ┃   ┃     ┗ posts.module.ts 
 ┃  ┃  ┃   ┃
 ┃  ┃  ┃   ┣📁media
 ┃  ┃  ┃   ┃    ┗📁aws(для начала буду делать самописный - потом перейду на aws)
 ┃  ┃  ┃   ┃    ┃ ┣📁args
 ┃  ┃  ┃   ┃    ┃ ┣📁decorators
 ┃  ┃  ┃   ┃    ┃ ┣📁entities
 ┃  ┃  ┃   ┃    ┃ ┣📁inputs
 ┃  ┃  ┃   ┃    ┃ ┣📁interfaces
 ┃  ┃  ┃   ┃    ┃ ┣📁args
 ┃  ┃  ┃   ┃    ┃ ┣ aws.controller.ts
 ┃  ┃  ┃   ┃    ┃ ┣ aws.service.ts
 ┃  ┃  ┃   ┃    ┃ ┗ aws.module.ts 
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┗📁metadata (Метаданные о медиа файлах (имя файла, путь к файлу, тип файла, дата загрузки и т.д.))
 ┃  ┃  ┃   ┃     ┣📁args
 ┃  ┃  ┃   ┃     ┣📁decorators
 ┃  ┃  ┃   ┃     ┣📁entities
 ┃  ┃  ┃   ┃     ┣📁inputs
 ┃  ┃  ┃   ┃     ┣📁interfaces
 ┃  ┃  ┃   ┃     ┣📁args
 ┃  ┃  ┃   ┃     ┣ metadata.controller.ts
 ┃  ┃  ┃   ┃     ┣ metadata.service.ts
 ┃  ┃  ┃   ┃     ┗ metadata.module.ts
 ┃  ┃  ┃   ┃
 ┃  ┃  ┃   ┣📁dialogs (список чатов)
 ┃  ┃  ┃   ┃    ┗📁dialog
 ┃  ┃  ┃   ┃     ┣📁args
 ┃  ┃  ┃   ┃     ┣📁decorators
 ┃  ┃  ┃   ┃     ┣📁entities
 ┃  ┃  ┃   ┃     ┣📁inputs
 ┃  ┃  ┃   ┃     ┣📁interfaces
 ┃  ┃  ┃   ┃     ┃  ┣ dialog.ts 
 ┃  ┃  ┃   ┃     ┃  ┣ dialogShort.ts 
 ┃  ┃  ┃   ┃     ┃  ┗ ... 
 ┃  ┃  ┃   ┃     ┣📁args
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

Currently, I'm working on the client side. 
I'll work on the server side later. 
What's already done on the server side was done a while ago.



#### Used Technologies:

| General    | <img src="./icons/typeScript.svg" width="50" height="50"> | <img src="./icons/Docker.svg" width="50" height="50"> | |                                                       |
|------------|-----------------------------------------------------------|-|-|-------------------------------------------------------|
| **Client** | <img src="./icons/nextLS.svg" width="50" height="50">         | <img src="./icons/rxjs.svg" width="50" height="50" alt='RxJS'> | <img src="./icons/sass.svg" alt="Sass" width="50" height="50"> |
| **Server** | <img src="./icons/nest.svg" width="50" height="50">          | <img src="./icons/typeorm.svg" width="50" height="50"> | <img src="./icons/postgresql.svg" width="50" height="50"> |
