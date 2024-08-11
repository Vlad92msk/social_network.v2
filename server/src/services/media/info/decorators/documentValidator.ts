import { FileValidator } from "@nestjs/common";


export class DocumentValidator extends FileValidator<{ maxSize: number }> {
    isValid(file: Express.Multer.File): boolean {
        const allowedMimeTypes = ['application/pdf'];
        return allowedMimeTypes.includes(file.mimetype) ? file.size < this.validationOptions.maxSize : true;
    }

    buildErrorMessage(file: Express.Multer.File): string {
        return `Invalid document file. Allowed types: pdf. Max size: ${this.validationOptions.maxSize} bytes.`;
    }
}
