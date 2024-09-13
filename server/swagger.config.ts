import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as YAML from 'yaml';
import * as fs from 'fs';
import * as path from 'path';

interface YamlGenerationConfig {
    host: string;
    port: number;
    directory: string;
}

interface Docs {
    module: any,
    url: string,
    name: string,
    description?: string,
    version: string
}

function generateYamlFiles(document: any, config: YamlGenerationConfig, moduleName: string) {
    console.log(`Начало генерации YAML файлов для модуля ${moduleName}`);

    const outputDir = path.join(config.directory, moduleName);
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

function generateInterfacesFile(document: any, config: YamlGenerationConfig, moduleName: string) {
    console.log(`Начало генерации интерфейсов для модуля ${moduleName}`);

    const outputDir = path.join(config.directory, moduleName);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let interfacesContent = '';

    if (document.components && document.components.schemas) {
        for (const [name, schema] of Object.entries(document.components.schemas)) {
            interfacesContent += `export interface ${name} {\n`;
            // @ts-ignore
            if (schema.properties) {
                // @ts-ignore
                for (const [propName, propSchema] of Object.entries(schema.properties)) {
                    const type = getTypeFromSchema(propSchema);
                    // @ts-ignore
                    interfacesContent += `  ${propName}${propSchema.required ? '' : '?'}: ${type};\n`;
                }
            }
            interfacesContent += '}\n\n';
        }
    }

    try {
        const filePath = path.join(outputDir, `interfaces-${moduleName}.ts`);
        fs.writeFileSync(filePath, interfacesContent, 'utf8');
        console.log(`Создан файл интерфейсов: ${filePath}`);
    } catch (error) {
        console.error(`Ошибка при создании файла интерфейсов для ${moduleName}:`, error);
    }

    console.log(`Завершение генерации интерфейсов для модуля ${moduleName}`);
}

function getTypeFromSchema(schema: any): string {
    if (schema.$ref) {
        return schema.$ref.split('/').pop();
    }
    switch (schema.type) {
        case 'string':
            return 'string';
        case 'integer':
        case 'number':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'array':
            return `${getTypeFromSchema(schema.items)}[]`;
        case 'object':
            return 'Record<string, any>';
        default:
            return 'any';
    }
}

function capitalizeFirstLetter(string: string): string {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function generateApiClientFile(document: any, config: YamlGenerationConfig, moduleName: string) {
    console.log(`Начало генерации API-клиента для модуля ${moduleName}`);

    const outputDir = path.join(config.directory, moduleName);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    let apiClientContent = '';

    // Импорты
    apiClientContent += `import { Observable, from } from "../../server/node_modules/rxjs";\n`;
    apiClientContent += `import { map, catchError } from "../../server/node_modules/rxjs/operators";\n\n`;

    // Импорт интерфейсов
    apiClientContent += `import { ${Object.keys(document.components.schemas).join(', ')} } from "./interfaces-${moduleName}";\n\n`;

    // Добавляем определение типа DefaultError
    apiClientContent += `export type DefaultError = {\n`;
    apiClientContent += `  code?: number;\n`;
    apiClientContent += `  message?: string;\n`;
    apiClientContent += `  description?: string;\n`;
    apiClientContent += `};\n\n`;

    // Обновляем определение интерфейса ApiResponse
    apiClientContent += `interface ApiResponse<T> {\n`;
    apiClientContent += `  data: T | undefined;\n`;
    apiClientContent += `  status: number;\n`;
    apiClientContent += `  headers: Headers;\n`;
    apiClientContent += `  url: string;\n`;
    apiClientContent += `  error?: DefaultError;\n`;
    apiClientContent += `}\n\n`;

    // Начало класса API
    apiClientContent += `export class ${capitalizeFirstLetter(moduleName)}Api {\n`;
    apiClientContent += `  private baseUrl = \`http://${process.env.API_HOST}:${process.env.API_PORT}\`;\n`;
    apiClientContent += `  private defaultConfig: RequestInit;\n\n`;
    apiClientContent += `  constructor(config?: { baseUrl?: string } & RequestInit) {\n`;
    apiClientContent += `    const { baseUrl, ...restConfig } = config || {};\n`;
    apiClientContent += `    if(baseUrl) { this.baseUrl = baseUrl };\n`;
    apiClientContent += `    this.defaultConfig = { headers: { 'Content-Type': 'application/json' }, ...restConfig };\n`;
    apiClientContent += `  }\n\n`;

    // Метод handleResponse
    apiClientContent += `  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {\n`;
    apiClientContent += `    const result: ApiResponse<T> = {\n`;
    apiClientContent += `      status: response.status,\n`;
    apiClientContent += `      headers: response.headers,\n`;
    apiClientContent += `      url: response.url,\n`;
    apiClientContent += `      data: undefined\n`;
    apiClientContent += `    };\n\n`;
    apiClientContent += `    try {\n`;
    apiClientContent += `      const data = await response.json();\n`;
    apiClientContent += `      if (!response.ok) {\n`;
    apiClientContent += `        result.error = {\n`;
    apiClientContent += `          code: response.status,\n`;
    apiClientContent += `          message: data.message || response.statusText,\n`;
    apiClientContent += `          description: data.error || 'Неизвестная ошибка',\n`;
    apiClientContent += `        };\n`;
    apiClientContent += `      } else {\n`;
    apiClientContent += `        result.data = data;\n`;
    apiClientContent += `      }\n`;
    apiClientContent += `    } catch (error) {\n`;
    apiClientContent += `      result.error = {\n`;
    apiClientContent += `        code: response.status,\n`;
    apiClientContent += `        message: 'Ошибка парсинга ответа',\n`;
    apiClientContent += `        description: error?.toString() || 'Неизвестная ошибка',\n`;
    apiClientContent += `      };\n`;
    apiClientContent += `    }\n`;
    apiClientContent += `    return result;\n`;
    apiClientContent += `  }\n\n`;

    // Метод wrapInObservable
    apiClientContent += `  private wrapInObservable<T>(promise: Promise<ApiResponse<T>>): Observable<T> {\n`;
    apiClientContent += `    return from(promise).pipe(\n`;
    apiClientContent += `      map(response => {\n`;
    apiClientContent += `        if (response.error) {\n`;
    apiClientContent += `          throw response.error;\n`;
    apiClientContent += `        }\n`;
    apiClientContent += `        return response.data as T;\n`;
    apiClientContent += `      }),\n`;
    apiClientContent += `      catchError((error: DefaultError) => {\n`;
    apiClientContent += `        console.error('Ошибка вызова метода:', error);\n`;
    apiClientContent += `        throw error;\n`;
    apiClientContent += `      })\n`;
    apiClientContent += `    );\n`;
    apiClientContent += `  }\n\n`;

    // Генерация методов API
    for (const [path, methods] of Object.entries(document.paths)) {
        for (const [method, operation] of Object.entries(methods)) {
            const operationId = operation.operationId?.split('_').pop() || `${method}${path.replace(/\//g, '_')}`;
            const parameters = operation.parameters || [];
            const requestBody = operation.requestBody;
            const responseSchema = operation.responses?.['200']?.content?.['application/json']?.schema;
            const responseType = responseSchema ? getTypeFromSchema(responseSchema) : 'any';


            // JSDoc комментарий для основного метода
            apiClientContent += `  /**\n`;
            apiClientContent += `   * ${operation.summary || 'Нет описания'}\n`;
            apiClientContent += `   *\n`;
            apiClientContent += `   * @tags ${operation.tags?.join(', ') || ''}\n`;
            apiClientContent += `   * @name ${operationId}\n`;
            apiClientContent += `   * @request ${method.toUpperCase()}:${path}\n`;
            apiClientContent += `   * @response \`200\` \`${responseType}\` OK\n`;
            apiClientContent += `   * @throws {DefaultError} Когда сервер отвечает статусом не 200 \n`;
            apiClientContent += `   */\n`;

            // Определение типа параметров
            let paramsType = '';
            if (parameters.length > 0 || requestBody) {
                let paramsList = [...new Set(parameters.map(p => `${p.name}${p.required ? '' : '?'}: ${getTypeFromSchema(p.schema)}`))];
                if (requestBody) {
                    const contentType = Object.keys(requestBody.content || {})[0];
                    if (contentType && requestBody.content[contentType].schema) {
                        paramsList.push(`body: ${getTypeFromSchema(requestBody.content[contentType].schema)}`);
                    } else {
                        paramsList.push(`body: any`);
                    }
                }
                paramsType = `{ ${paramsList.join(', ')} }`;
            }

            // Основной метод API
            apiClientContent += `  ${operationId}(`;
            if (paramsType) {
                apiClientContent += `params?: ${paramsType}, `;
            }
            apiClientContent += `requestParams?: RequestInit): Promise<ApiResponse<${responseType}>> {\n`;
            apiClientContent += `    const {url, ...rest} = this.${operationId}Init(${paramsType ? 'params, ' : ''}requestParams);\n`;
            apiClientContent += `    return fetch(url, rest).then(response => this.handleResponse<${responseType}>(response));\n`;
            apiClientContent += `  }\n\n`;

            // JSDoc комментарий для Observable метода
            apiClientContent += `  /**\n`;
            apiClientContent += `   * Observable version of ${operationId}\n`;
            apiClientContent += `   * @see ${operationId} for more details\n`;
            apiClientContent += `   * @throws {DefaultError} Когда сервер отвечает статусом не 200\n`;
            apiClientContent += `   */\n`;

            // Метод Observable
            apiClientContent += `  ${operationId}Observable(`;
            if (paramsType) {
                apiClientContent += `params?: ${paramsType}, `;
            }
            apiClientContent += `requestParams?: RequestInit): Observable<${responseType}> {\n`;
            apiClientContent += `    return this.wrapInObservable(this.${operationId}(${paramsType ? 'params, ' : ''}requestParams));\n`;
            apiClientContent += `  }\n\n`;

            // Вспомогательный метод Init
            apiClientContent += `  private ${operationId}Init(`;
            if (paramsType) {
                apiClientContent += `params?: ${paramsType}, `;
            }
            apiClientContent += `requestParams?: RequestInit): { url: string } & RequestInit {\n`;
            apiClientContent += `    const url = new URL(\`${path.replace(/{/g, '${params?.')}\`, this.baseUrl);\n`;

            // Добавление query-параметров
            apiClientContent += `    if (params) {\n`;
            apiClientContent += `      Object.entries(params).forEach(([key, value]) => {\n`;
            apiClientContent += `        if (value !== undefined) {\n`;
            apiClientContent += `          url.searchParams.append(key, value.toString());\n`;
            apiClientContent += `        }\n`;
            apiClientContent += `      });\n`;
            apiClientContent += `    }\n`;

            apiClientContent += `    const init: RequestInit = {\n`;
            apiClientContent += `      method: '${method.toUpperCase()}',\n`;
            apiClientContent += `      ...this.defaultConfig,\n`;
            if (requestBody) {
                apiClientContent += `      body: params?.body ? JSON.stringify(params.body) : undefined,\n`;
            }
            apiClientContent += `      ...requestParams,\n`;
            apiClientContent += `      headers: { ...this.defaultConfig?.headers, ...requestParams?.headers },\n`;
            apiClientContent += `    };\n`;
            apiClientContent += `    return { ...init, url: url.toString() };\n`;
            apiClientContent += `  }\n\n`;
        }
    }

    apiClientContent += `}\n`;

    try {
        const filePath = path.join(outputDir, `api-client-${moduleName}.ts`);
        fs.writeFileSync(filePath, apiClientContent, 'utf8');
        console.log(`Создан файл API-клиента: ${filePath}`);
    } catch (error) {
        console.error(`Ошибка при создании файла API-клиента для ${moduleName}:`, error);
    }

    console.log(`Завершение генерации API-клиента для модуля ${moduleName}`);
}

export function setupSwagger(app: INestApplication, config: YamlGenerationConfig, docs: Docs[]) {
    console.log(`Swagger документация доступна:`);
    const result = []

    docs.forEach(doc => {
        const options = new DocumentBuilder()
            .setTitle(doc.name)
            .setDescription(doc.description)
            .setVersion(doc.version)
            .addTag(doc.url)
            .build();

        const document = SwaggerModule.createDocument(app, options, {
            include: [doc.module],
        });

        const url = `docs/${doc.url}`
        SwaggerModule.setup(url, app, document);
        generateYamlFiles(document, config, doc.url);
        generateInterfacesFile(document, config, doc.url);
        generateApiClientFile(document, config, doc.url);

        result.push(`${doc.name}: http://${config.host}:${config.port}/${url}`)
    });

    return result;
}
