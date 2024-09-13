import { hasIn } from 'lodash';
import { ResponseApiService } from "../../root.effects";

/**
 * Справа - ключ как называется в ОТВЕТЕ
 * Слева - как мы его хотим ПЕРЕИМЕНОВАТЬ
 */
interface HeaderMapping {
  pages: string;
  per_page: string;
  page: string;
}

const headerMappingInitial: HeaderMapping = {
  pages: 'pages',
  page: 'page',
  per_page: 'pagesize',
};

type HeaderMappingResponse<T> = Record<keyof HeaderMapping, number> & Record<keyof T, string | number>;

/**
 * Утилита для обработки ответа от метода
 * принимает response и возвращает data и headers
 * имеет смысл использовать если нам нужно получить headers
 */
export const getResponse = <RESPONSE_DATA, MAPPING_HEADERS_PROPS extends Record<string, string>>(
  { data, headers: headersResponse }: ResponseApiService<RESPONSE_DATA>,
  headerMapping?: MAPPING_HEADERS_PROPS,
): {
  data: RESPONSE_DATA;
  headers: HeaderMappingResponse<MAPPING_HEADERS_PROPS>;
} => {
  const parsedHeaders = {} as HeaderMappingResponse<MAPPING_HEADERS_PROPS>;
  const combinedMapping = { ...headerMappingInitial, ...headerMapping };

  for (const [key, headerName] of Object.entries(combinedMapping)) {
    if (hasIn(combinedMapping, key)) {
      const value = headersResponse.get(headerName);
      // @ts-ignore
      parsedHeaders[key] = isNaN(Number(value)) ? value : parseInt(String(value), 10);
    }
  }

  return {
    data,
    headers: parsedHeaders,
  };
};
export type GetResponse = typeof getResponse;
