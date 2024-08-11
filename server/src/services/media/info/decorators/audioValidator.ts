import { FileValidator } from "@nestjs/common";

export class AudioValidator extends FileValidator<{ maxSize: number }> {
    isValid(file: Express.Multer.File): boolean {
        const allowedMimeTypes = ['audio/mpeg', 'audio/wav'];
        return allowedMimeTypes.includes(file.mimetype) ? file.size < this.validationOptions.maxSize : true;
    }

    buildErrorMessage(file: Express.Multer.File): string {
        return `Invalid audio file. Allowed types: mpeg, wav. Max size: ${this.validationOptions.maxSize} bytes.`;
    }
}
