import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as YAML from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

interface YamlGenerationConfig {
    host: string;
    port: number;
}


interface Docs {
    module: any,
        url: string,
    name: string,
    title: string,
    description: string,
    tag: string
    version: string
}

function generateYamlFiles(document: any, config: YamlGenerationConfig, moduleName: string) {
    console.log(`Начало генерации YAML файлов для модуля ${moduleName}`);

    const outputDir = path.join(process.cwd(), 'swagger-yaml', moduleName);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const tags = document.tags;
    const paths = document.paths;

    if (tags.length === 0) {
        console.log('Предупреждение: в документе нет тегов');
    }

    const controllerDoc = {
        openapi: document.openapi,
        info: document.info,
        servers: [{
            url: `http://${config.host}:${config.port}`,
            description: 'API сервер'
        }],
        tags: tags,
        paths: paths,
        components: document.components
    };

    try {
        const yamlDoc = YAML.stringify(controllerDoc);
        const filePath = path.join(outputDir, `swagger-${moduleName}.yaml`);
        fs.writeFileSync(filePath, yamlDoc, 'utf8');
        console.log(`Создан файл: ${filePath}`);
    } catch (error) {
        console.error(`Ошибка при создании файла для ${moduleName}:`, error);
    }

    console.log(`Завершение генерации YAML файлов для модуля ${moduleName}`);
}

export function setupSwagger(app: INestApplication, config: YamlGenerationConfig, docs: Docs[]) {
    console.log(`Swagger документация доступна:`);
    const result = []

    docs.forEach(doc => {
        const options = new DocumentBuilder()
            .setTitle(doc.title)
            .setDescription(doc.description)
            .setVersion(doc.version)
            .addTag(doc.tag)
            .build();

        const document = SwaggerModule.createDocument(app, options, {
            include: [doc.module],
        });

        const url = `docs/${doc.url}`
        SwaggerModule.setup(url, app, document);
        generateYamlFiles(document, config, doc.url);

        result.push(`${doc.name}: http://${config.host}:${config.port}/${url}`)
    });

    return result;
}
