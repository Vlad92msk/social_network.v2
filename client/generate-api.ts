import * as fs from 'fs';
import * as path from 'path';

// Путь, куда будут сохраняться сгенерированные файлы
const OUTPUT_DIR = path.join(__dirname, 'app', '_store', 'generated');

// Путь к папке swagger
const SWAGGER_DIR = path.join(__dirname, '../swagger');

// Шаблон для генерации файлов API
const API_TEMPLATE = (apiName: string, className: string, methodNames: string[]) => `
    import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
    import { ${className} } from '../../../../swagger/${apiName}/api-client-${apiName}';
    
    const ${apiName}ApiInstance = new ${className}();
    
    export const ${apiName}Api = createApi({
      reducerPath: '${apiName}RTK',
      baseQuery: fetchBaseQuery({
        // baseUrl: '',
        // prepareHeaders: (headers, { getState }) => {
        //   // @ts-ignore
        //   const token = (getState()).auth.token;
        //   if (token) {
        //     headers.set('authorization', \`Bearer \${token}\`);
        //   }
        //   return headers;
        // },
      }),
      endpoints: (builder) => ({
        ${methodNames.map(methodName => {
            const baseMethodName = methodName.replace('Init', '');
            return `    ${baseMethodName}: builder.${baseMethodName.startsWith('get') || baseMethodName.startsWith('find') ? 'query' : 'mutation'}<
              ReturnType<typeof ${apiName}ApiInstance.${baseMethodName}>,
              Parameters<typeof ${apiName}ApiInstance.${methodName}>[0]
            >({
              // query: ${apiName}ApiInstance.${methodName},
              query: (params) => {
                  const {url, ...rest} = ${apiName}ApiInstance.${methodName}(params)
                  return ({ url, ...rest })
              },
            }),`;
        }).join('\n')}
      }),
    });
`;

function generateApiFile(apiName: string) {
    const apiClientFile = path.join(SWAGGER_DIR, apiName, `api-client-${apiName}.ts`);

    if (!fs.existsSync(apiClientFile)) {
        console.error(`API client file not found: ${apiClientFile}`);
        return;
    }

    const apiClientContent = fs.readFileSync(apiClientFile, 'utf-8');
    const className = apiClientContent.match(/export class (\w+)/)?.[1];

    if (!className) {
        console.error(`Could not find class name in ${apiClientFile}`);
        return;
    }

    const methodNames = apiClientContent.match(/(\w+Init)\(params\?:/g)?.map(match => match.replace('(params?:', '')) || [];

    const code = API_TEMPLATE(apiName, className, methodNames);

    const outputFile = path.join(OUTPUT_DIR, `${apiName}.api.ts`);
    fs.writeFileSync(outputFile, code);
    console.log(`Generated ${outputFile}`);
}

function generateIndexFile(apis: string[]) {
    const indexContent = apis.map(api => `export * from './${api}.api';`).join('\n');
    const indexFile = path.join(OUTPUT_DIR, 'index.ts');
    fs.writeFileSync(indexFile, indexContent);
    console.log(`Generated ${indexFile}`);
}

// Создаем выходную директорию, если она не существует
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Получаем список всех API из папки swagger
const apis = fs.readdirSync(SWAGGER_DIR).filter(file => fs.statSync(path.join(SWAGGER_DIR, file)).isDirectory());

// Генерируем файлы для каждого API
apis.forEach(generateApiFile);

// Генерируем index.ts
generateIndexFile(apis);

console.log('API generation completed.');
