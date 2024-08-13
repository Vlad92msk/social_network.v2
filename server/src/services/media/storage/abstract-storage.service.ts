import { MediaItemType } from "../metadata/interfaces/mediaItemType";

export abstract class AbstractStorageService {
    abstract uploadFile(file: Buffer, fileName: string, userId: string, fileType: MediaItemType): Promise<string>;
    abstract getFile(filePath: string): Promise<Buffer>;
    abstract deleteFile(filePath: string): Promise<void>;
    abstract getFileType(mimeType: string): MediaItemType;
}
