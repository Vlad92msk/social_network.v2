import { validate as uuidValidate } from 'uuid';
import { BadRequestException } from "@nestjs/common";

export const validUuids = (targetIds: string[]) => {
    if (!targetIds) return null

    if (targetIds?.length) {
        let idsArray: string[];
        if (typeof targetIds === 'string') {
            // @ts-ignore
            idsArray = targetIds.split(',').map(id => id.trim());
        } else if (Array.isArray(targetIds)) {
            idsArray = targetIds;
        } else {
            throw new BadRequestException('Невалидный формат file_ids');
        }

        const validIds = idsArray.filter(uuidValidate);
        if (validIds.length === 0) {
            throw new BadRequestException('Нет ни одного валидного значения в file_ids');
        }

        return validIds
    }
}
