/**
 * @summary метаданные файла
 */
export interface FileObject {
    name: string,
    src: string,
    type: string,
    size: number,
    lastModified: string,
    blob: Blob
}
