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

```
📦social_network
 ┣ 📁database
 ┣ 📁pgadmin
 ┃
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
 ┃  ┃  ┃      
 ┃  ┃  ┣📁services (микросервисы)
 ┃  ┃  ┃   ┣📁profile
 ┃  ┃  ┃   ┣📁comments (модуль для работы с комментариями)
 ┃  ┃  ┃   ┣📁tags (модуль для работы с тегами)
 ┃  ┃  ┃   ┣📁posts (модуль для работы с постами)
 ┃  ┃  ┃   ┣📁dialogs (модуль для работы с чатом(диалогами) - по сути это messenger)
 ┃  ┃  ┃   ┃
 ┃  ┃  ┃   ┣📁media
 ┃  ┃  ┃   ┃    ┗📁info(информация о медиа-файле относительно пользователя - теги, связь с таблицей комментарией, реакции пользователей и т.д.)
 ┃  ┃  ┃   ┃    ┃ ┣📁args
 ┃  ┃  ┃   ┃    ┃ ┣📁decorators
 ┃  ┃  ┃   ┃    ┃ ┣📁entities
 ┃  ┃  ┃   ┃    ┃ ┣📁dto
 ┃  ┃  ┃   ┃    ┃ ┣📁interfaces
 ┃  ┃  ┃   ┃    ┃ ┣ media-info.controller.ts
 ┃  ┃  ┃   ┃    ┃ ┣ media-info.service.ts
 ┃  ┃  ┃   ┃    ┃ ┗ media-info.module.ts 
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┣📁storage (отвечает за физическое хранение/получение файлов, трансформацию из одного формата в другой и т.д. - в дальнейшем вместо этого может быть переход на aws)
 ┃  ┃  ┃   ┃    ┃ ┣📁args
 ┃  ┃  ┃   ┃    ┃ ┣📁decorators
 ┃  ┃  ┃   ┃    ┃ ┣📁entities
 ┃  ┃  ┃   ┃    ┃ ┣📁dto
 ┃  ┃  ┃   ┃    ┃ ┣📁interfaces
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
 ┃  ┃  ┃   ┃     ┣ metadata.controller.ts
 ┃  ┃  ┃   ┃     ┣ metadata.service.ts
 ┃  ┃  ┃   ┃     ┗ metadata.module.ts
 ┃  ┃  ┃   ┃ 
 ┃  ┃  ┃   ┗ app.module.ts
 ┃  ┃  ┃
 ┃  ┃  ┣ 📁migrations
 ┃  ┃  ┣ 📁utils
 ┃  ┗ ...
 ┃
 ┣ 📄.env
 ┣ 📄Makefile
 ┗ 📄docker-compose.dev.yml
 ┗ 📄docker-compose.prod.yml

 ```

```
📦social_network
 ┣ 📁database
 ┣ 📁pgadmin
 ┃
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
 ┃  ┃  ┣ entity
 ┃  ┃  ┃   ┣ media-info.entity.ts
 ┃  ┃  ┃   ┣ media-metadata.entity.ts
 ┃  ┃  ┃   ┣ profile.entity.ts
 ┃  ┃  ┃   ┣ comments.entity.ts
 ┃  ┃  ┃   ┣ tags.entity.ts
 ┃  ┃  ┃   ┣ posts.entity.ts
 ┃  ┃  ┃   ┣ dialogs.entity.ts
 ┃  ┃  ┃   ┗ ...    
 ┃  ┃  ┃      
 ┃  ┃  ┣📁services (микросервисы)
 ┃  ┃  ┃   ┣📁profile
 ┃  ┃  ┃   ┣📁comments (модуль для работы с комментариями)
 ┃  ┃  ┃   ┣📁tags (модуль для работы с тегами)
 ┃  ┃  ┃   ┣📁posts (модуль для работы с постами)
 ┃  ┃  ┃   ┣📁dialogs (модуль для работы с чатом(диалогами) - по сути это messenger)
 ┃  ┃  ┃   ┃
 ┃  ┃  ┃   ┣📁media
 ┃  ┃  ┃   ┃    ┗📁info(информация о медиа-файле относительно пользователя - теги, связь с таблицей комментарией, реакции пользователей и т.д.)
 ┃  ┃  ┃   ┃    ┃ ┣📁args
 ┃  ┃  ┃   ┃    ┃ ┣📁decorators
 ┃  ┃  ┃   ┃    ┃ ┣📁dto
 ┃  ┃  ┃   ┃    ┃ ┣📁interfaces
 ┃  ┃  ┃   ┃    ┃ ┣ media-info.controller.ts
 ┃  ┃  ┃   ┃    ┃ ┣ media-info.service.ts
 ┃  ┃  ┃   ┃    ┃ ┗ media-info.module.ts 
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┣📁storage (отвечает за физическое хранение/получение файлов, трансформацию из одного формата в другой и т.д. - в дальнейшем вместо этого может быть переход на aws)
 ┃  ┃  ┃   ┃    ┃ ┣📁args
 ┃  ┃  ┃   ┃    ┃ ┣📁decorators
 ┃  ┃  ┃   ┃    ┃ ┣📁dto
 ┃  ┃  ┃   ┃    ┃ ┣📁interfaces
 ┃  ┃  ┃   ┃    ┃ ┣ storage.controller.ts
 ┃  ┃  ┃   ┃    ┃ ┣ storage.service.ts
 ┃  ┃  ┃   ┃    ┃ ┗ storage.module.ts 
 ┃  ┃  ┃   ┃    ┃
 ┃  ┃  ┃   ┃    ┗📁metadata (метаданные о медиа файлах (имя файла, путь к файлу, тип файла, дата загрузки и т.д.))
 ┃  ┃  ┃   ┃     ┣📁args
 ┃  ┃  ┃   ┃     ┣📁decorators
 ┃  ┃  ┃   ┃     ┣📁dto
 ┃  ┃  ┃   ┃     ┣📁interfaces
 ┃  ┃  ┃   ┃     ┣ metadata.controller.ts
 ┃  ┃  ┃   ┃     ┣ metadata.service.ts
 ┃  ┃  ┃   ┃     ┗ metadata.module.ts
 ┃  ┃  ┃   ┃ 
 ┃  ┃  ┃   ┗ app.module.ts
 ┃  ┃  ┃
 ┃  ┃  ┣ 📁migrations
 ┃  ┃  ┣ 📁utils
 ┃  ┗ ...
 ┃
 ┣ 📄.env
 ┣ 📄Makefile
 ┗ 📄docker-compose.dev.yml
 ┗ 📄docker-compose.prod.yml

 ```
