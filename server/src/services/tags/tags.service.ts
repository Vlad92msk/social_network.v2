import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Tag } from "@services/tags/entity";
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { FindTagDto } from './dto/find-tag.dto';
import { createPaginationQueryOptions, createPaginationResponse, validUuids } from "@shared/utils";
import { RequestParams } from "@shared/decorators";

@Injectable()
export class TagsService {
    constructor(
        @InjectRepository(Tag)
        private tagRepository: Repository<Tag>,
    ) {}

    async createTag(createTagDto: CreateTagDto){
        const newTag = this.tagRepository.create(createTagDto);
        return await this.tagRepository.save(newTag);
    }

    async deleteTag(id: string) {
        const result = await this.tagRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Tag with ID "${id}" not found`);
        }
    }

    async updateTag(id: string, updateTagDto: UpdateTagDto) {
        const tag = await this.tagRepository.preload({
            id: id,
            ...updateTagDto,
        });
        if (!tag) {
            throw new NotFoundException(`Tag with ID "${id}" not found`)
        }
        return await this.tagRepository.save(tag)
    }

    async findTags(query: FindTagDto, params: RequestParams) {
        const queryOptions = createPaginationQueryOptions({ query })

        /**
         * TODO: пока не разобрался как работает
         * и скорей всего нужно отдельный метод делать для этого
         */
        // Если нужно использовать LIKE для поиска по name или value
        // if (query?.search) {
        //     queryOptions.where = [
        //         { name: Like(`%${query.search}%`) },
        //         { value: Like(`%${query.search}%`) }
        //     ];
        // }
        const [tags, total] = await this.tagRepository.findAndCount(queryOptions)
        return createPaginationResponse({ data: tags, total, query })
    }

    async findTagById(id: string) {
        const tag = await this.tagRepository.findOne({ where: { id } })
        if (!tag) {
            throw new NotFoundException(`Tag with ID "${id}" not found`)
        }
        return tag
    }

    async findTagsByIds(file_ids: string[]) {
        const ids = validUuids(file_ids)
        return await this.tagRepository.findBy({ id: In(ids) })
    }
}
