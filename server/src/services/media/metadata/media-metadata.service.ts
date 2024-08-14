import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { CreateMediaMetadataDto } from "./dto/create-media-metadata.dto";
import { UpdateMediaMetadataDto } from "./dto/update-media-metadata.dto";
import { MediaMetadata } from "./entities/media-metadata.entity";
import { GetMediaMetadataDto } from "./dto/get-media-metadata.dto";
import { validate as uuidValidate } from 'uuid';

@Injectable()
export class MetadataService {
    constructor(
        @InjectRepository(MediaMetadata)
        private metadataRepository: Repository<MediaMetadata>,
    ) {}

    async create(createMediaMetadataDto: CreateMediaMetadataDto): Promise<MediaMetadata> {
        const metadata = this.metadataRepository.create(createMediaMetadataDto);
        return await this.metadataRepository.save(metadata);
    }

    async findAll(query: GetMediaMetadataDto): Promise<{ data: MediaMetadata[]; total: number }> {
        const { page = 1, per_page = 10, sort_by = 'name', sort_direction = 'ASC', file_ids, ...searchParams } = query;

        const where: FindOptionsWhere<MediaMetadata> = { ...searchParams };

        if (file_ids?.length) {
            let idsArray: string[];
            if (typeof file_ids === 'string') {
                // @ts-ignore
                idsArray = file_ids.split(',').map(id => id.trim());
            } else if (Array.isArray(file_ids)) {
                idsArray = file_ids;
            } else {
                throw new BadRequestException('Невалидный формат file_ids');
            }

            const validIds = idsArray.filter(uuidValidate);
            if (validIds.length === 0) {
                throw new BadRequestException('Нет ни одного валидного значения в file_ids');
            }

            where.id = In(validIds);
        }

        const [data, total] = await this.metadataRepository.findAndCount({
            where,
            skip: (page - 1) * per_page,
            take: per_page,
            order: { [sort_by]: sort_direction },
        });

        return { data, total };
    }

    async findOne(id: string): Promise<MediaMetadata> {
        return await this.metadataRepository.findOne({ where: { id } });
    }

    async update(id: string, updateMediaMetadataDto: UpdateMediaMetadataDto): Promise<MediaMetadata> {
        await this.metadataRepository.update(id, updateMediaMetadataDto);
        return this.findOne(id);
    }

    async remove(id: string): Promise<void> {
        await this.metadataRepository.delete(id);
    }

    async getUserStorageUsage(userId: string): Promise<number> {
        const result = await this.metadataRepository
            .createQueryBuilder('metadata')
            .select('SUM(metadata.size)', 'totalSize')
            .where('metadata.user_id = :userId', { userId })
            .getRawOne();

        const totalSize = Number(result.totalSize) || 0;
        return totalSize;
    }
}
