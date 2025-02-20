/**
 * utils/file-utils.ts
 * Утилиты для работы с файлами
 */
import { FileMetadata, ResponseFormat } from '../types/api.interface';

/**
 * Получает имя файла из заголовков ответа
 * @param headers Заголовки ответа
 * @returns Имя файла или undefined
 */
export function getFileNameFromHeaders(headers: Headers): string | undefined {
  // Разбор Content-Disposition заголовка
  const contentDisposition = headers.get('Content-Disposition');
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=(?:(\\?['"])(.*?)\1|(?:[^\s]+'.*?')?([^;\n]*))/i);
    if (filenameMatch && (filenameMatch[2] || filenameMatch[3])) {
      return decodeURIComponent(filenameMatch[2] || filenameMatch[3] || '');
    }
  }

  // Попытка извлечь имя файла из URL
  const urlHeader = headers.get('X-Original-URL') || headers.get('X-Request-URL');
  if (urlHeader) {
    try {
      const url = new URL(urlHeader);
      const pathParts = url.pathname.split('/');
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.includes('.')) {
        return lastPart;
      }
    } catch (e) {
      // Ошибка при парсинге URL - игнорируем
    }
  }

  return undefined;
}

/**
 * Получает тип файла из заголовков ответа
 * @param headers Заголовки ответа
 * @returns MIME-тип файла или undefined
 */
export function getFileTypeFromHeaders(headers: Headers): string | undefined {
  return headers.get('Content-Type') || undefined;
}

/**
 * Получает метаданные файла из заголовков ответа
 * @param headers Заголовки ответа
 * @param defaultFileName Имя файла по умолчанию, если не удалось извлечь из заголовков
 * @param defaultFileType Тип файла по умолчанию, если не удалось извлечь из заголовков
 * @returns Метаданные файла
 */
export function getFileMetadataFromHeaders(
  headers: Headers,
  defaultFileName: string = 'download',
  defaultFileType: string = 'application/octet-stream'
): FileMetadata {
  const fileName = getFileNameFromHeaders(headers) || defaultFileName;
  const fileType = getFileTypeFromHeaders(headers) || defaultFileType;
  const size = headers.get('Content-Length') ? parseInt(headers.get('Content-Length') || '0', 10) : undefined;
  const lastModified = headers.get('Last-Modified') 
    ? new Date(headers.get('Last-Modified') || '')
    : undefined;

  return {
    fileName, 
    fileType,
    size,
    updatedAt: lastModified,
    createdAt: lastModified
  };
}

/**
 * Скачивает файл через браузер
 * @param data Данные файла (Blob или ArrayBuffer)
 * @param fileName Имя файла
 * @param fileType MIME-тип файла
 */
export function downloadFile(
  data: Blob | ArrayBuffer, 
  fileName: string, 
  fileType?: string
): void {
  try {
    const blob = data instanceof Blob 
      ? data 
      : new Blob([data], { type: fileType || 'application/octet-stream' });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeFileName(fileName);
    
    // Добавляем элемент в DOM и симулируем клик
    document.body.appendChild(a);
    a.click();
    
    // Удаляем элемент и освобождаем ресурсы
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('[API] Ошибка при скачивании файла', error);
    throw new Error(`Не удалось скачать файл: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Очищает имя файла от недопустимых символов
 * @param fileName Исходное имя файла
 * @returns Безопасное имя файла
 */
export function sanitizeFileName(fileName: string): string {
  // Удаляем недопустимые символы
  let sanitized = fileName.replace(/[/\\?%*:|"<>]/g, '_');
  
  // Убеждаемся, что имя файла не начинается с точки (hidden file)
  if (sanitized.startsWith('.')) {
    sanitized = `_${sanitized}`;
  }
  
  return sanitized || 'download';
}

/**
 * Определяет расширение файла на основе MIME-типа
 * @param mimeType MIME-тип файла
 * @returns Расширение файла (с точкой)
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'text/plain': '.txt',
    'text/csv': '.csv',
    'text/html': '.html',
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'application/zip': '.zip',
    'application/x-rar-compressed': '.rar',
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'video/mp4': '.mp4',
    'video/mpeg': '.mpeg',
    'application/json': '.json',
    'application/xml': '.xml'
  };
  
  return mimeToExt[mimeType] || '';
}

/**
 * Определяет формат ответа на основе MIME-типа
 * @param mimeType MIME-тип
 * @returns Формат ответа
 */
export function getResponseFormatForMimeType(mimeType: string): ResponseFormat {
  if (!mimeType) return ResponseFormat.Json;
  
  // Текстовые форматы
  if (
    mimeType.includes('text/') || 
    mimeType.includes('application/json') || 
    mimeType.includes('application/xml') ||
    mimeType.includes('application/javascript')
  ) {
    return ResponseFormat.Text;
  }
  
  // Бинарные форматы
  if (
    mimeType.includes('application/octet-stream') ||
    mimeType.includes('application/pdf') ||
    mimeType.includes('application/msword') ||
    mimeType.includes('application/vnd.openxmlformats') ||
    mimeType.includes('application/vnd.ms-') ||
    mimeType.includes('image/') ||
    mimeType.includes('audio/') ||
    mimeType.includes('video/') ||
    mimeType.includes('application/zip') ||
    mimeType.includes('application/x-rar')
  ) {
    return ResponseFormat.Blob;
  }
  
  // По умолчанию возвращаем JSON
  return ResponseFormat.Json;
}

/**
 * Проверяет, является ли ответ файлом на основе заголовков
 * @param headers Заголовки ответа
 * @returns true, если ответ является файлом
 */
export function isFileResponse(headers: Headers): boolean {
  const contentType = headers.get('Content-Type');
  if (!contentType) return false;
  
  // Проверка наличия заголовка Content-Disposition
  const contentDisposition = headers.get('Content-Disposition');
  if (contentDisposition && contentDisposition.includes('attachment')) {
    return true;
  }
  
  // Проверка MIME-типа
  return (
    contentType.includes('application/octet-stream') ||
    contentType.includes('application/pdf') ||
    contentType.includes('application/msword') ||
    contentType.includes('application/vnd.openxmlformats') ||
    contentType.includes('application/vnd.ms-') ||
    contentType.includes('image/') ||
    contentType.includes('audio/') ||
    contentType.includes('video/') ||
    contentType.includes('application/zip') ||
    contentType.includes('application/x-rar')
  );
}