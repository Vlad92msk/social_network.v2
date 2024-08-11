import { FileValidator } from "@nestjs/common";

export class VideoValidator extends FileValidator<{ maxSize: number }> {
    isValid(file: Express.Multer.File): boolean {
        const allowedMimeTypes = ['video/mp4', 'video/webm'];
        return allowedMimeTypes.includes(file.mimetype) ? file.size < this.validationOptions.maxSize : true;
    }

    buildErrorMessage(file: Express.Multer.File): string {
        return `Invalid video file. Allowed types: mp4, webm. Max size: ${this.validationOptions.maxSize} bytes.`;
    }
}
