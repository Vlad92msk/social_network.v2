import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMediaMetadataDto } from "./dto/create-media-metadata.dto";
import { UpdateMediaMetadataDto } from "./dto/update-media-metadata.dto";
import { MediaMetadata } from "./entities/media-metadata.entity";

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

    async findAll(): Promise<MediaMetadata[]> {
        return await this.metadataRepository.find();
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

        return result.totalSize || 0;
    }
}
