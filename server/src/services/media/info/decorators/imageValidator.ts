import { FileValidator } from '@nestjs/common';

export class ImageValidator extends FileValidator<{ maxSize: number }> {
    isValid(file: Express.Multer.File): boolean {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        return allowedMimeTypes.includes(file.mimetype) ? file.size < this.validationOptions.maxSize : true;
    }

    buildErrorMessage(file: Express.Multer.File): string {
        return `Invalid image file. Allowed types: jpeg, png, gif, webp. Max size: ${this.validationOptions.maxSize} bytes.`;
    }
}
