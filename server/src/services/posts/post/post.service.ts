import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { MediaEntitySourceType } from '@services/media/info/entities/media.entity'
import { MediaInfoService } from '@services/media/info/media-info.service'
import { MediaItemType } from '@services/media/metadata/interfaces/mediaItemType'
import { FindPostDto } from '@services/posts/post/dto/find-post.dto'
import { PostResponseDto } from '@services/posts/post/dto/post-response.dto'
import { CalculateReactionsResponse } from '@services/reactions/dto/toggle-reaction-response.dto'
import { ReactionsService } from '@services/reactions/reactions.service'
import { TagsService } from '@services/tags/tags.service'
import { UserInfoService } from '@services/users/user-info/user-info.service'
import { RequestParams } from '@shared/decorators'
import { PublicationType } from '@shared/entity/publication.entity'
import { SortDirection } from '@shared/types'
import { createPaginationQueryOptions, createPaginationResponse, updateEntityParams } from '@shared/utils'
import { omit } from 'lodash'
import { LessThanOrEqual, Repository } from 'typeorm'
import { CreatePostDto } from './dto/create-post.dto'
import { UpdatePostDto } from './dto/update-post.dto'
import { PostEntity, PostVisibility } from './entities/post.entity'

@Injectable()
export class PostsService {
    constructor(
        @InjectRepository(PostEntity)
        private postRepository: Repository<PostEntity>,

        @Inject(forwardRef(() => MediaInfoService))
        private mediaInfoService: MediaInfoService,

        @Inject(forwardRef(() => UserInfoService))
        private userInfoService: UserInfoService,

        @Inject(forwardRef(() => TagsService))
        private tagsService: TagsService,

      @Inject(forwardRef(() => ReactionsService))
      private reactionsService: ReactionsService,
    ) {}

    /**
     * Создать Пост
     */
    async create(
        { videos, voices, createPostDto, media }: { createPostDto: CreatePostDto, media: Express.Multer.File[], voices: Express.Multer.File[], videos: Express.Multer.File[] },
        params: RequestParams
    ) {
        const author = await this.userInfoService.getUsersById(params.user_info_id)

        const post = this.postRepository.create({
            author,
            text: createPostDto.text,
            title: createPostDto.title,
            location: createPostDto.location,
            pinned: createPostDto.pinned,
            visibility: createPostDto.visibility,
            comments_count: 0,
            date_updated: null,
            reactions: [],
        })

        if (media && media.length > 0) {
            const uploadedMedia = await this.mediaInfoService.uploadFiles(media, author.id, MediaEntitySourceType.PUBLICATION)
            post.media = uploadedMedia
        }
        if (voices && voices.length > 0) {
            const uploadedVoices = await this.mediaInfoService.uploadFiles(voices, author.id, MediaEntitySourceType.PUBLICATION, MediaItemType.VOICE)
            post.voices = uploadedVoices
        }
        if (videos && videos.length > 0) {
            const uploadedVideos = await this.mediaInfoService.uploadFiles(videos, author.id, MediaEntitySourceType.PUBLICATION, MediaItemType.SHORTS)
            post.videos = uploadedVideos
        }

        if (createPostDto.tag_ids) {
            post.tags = await this.tagsService.findTagsByIds(createPostDto.tag_ids)
        }

        if (createPostDto?.media_ids) {
            const { data } = await this.mediaInfoService.getFiles({ file_ids: createPostDto.media_ids })
            post.media = [...(post.media || []), ...data]
        }

        if (createPostDto.scheduled_publish_time) {
            post.visibility = PostVisibility.PRIVATE
        }

        return this.postRepository.save(post)
    }

    /**
     * Обновить Пост
     */
    async update(
        id: string,
        { videos, voices, updatePostDto, media }: { updatePostDto: UpdatePostDto, media: Express.Multer.File[], voices: Express.Multer.File[], videos: Express.Multer.File[] },
        userId: number
    ) {
        const post = await this.postRepository.findOne({
            where: { id },
            relations: ['media', 'media.meta', 'voices', 'videos', 'tags', 'author', 'reactions']
        })

        if (!post) throw new NotFoundException(`Пост с ID "${id}" не найден`)
        if (post.author.id !== userId) throw new BadRequestException('Вы не можете обновить чужой пост')

        // Обновляем простые поля если они переданы
        updateEntityParams(
            post,
            updatePostDto,
            ['title', 'location', 'pinned', 'visibility', 'text']
        )

        // Если есть ID тегов которые нужно добавить
        if (updatePostDto.tag_ids) {
            const newTags = await this.tagsService.findTagsByIds(updatePostDto.tag_ids)
            post.tags = [...(post.tags || []), ...newTags]
        }

        // Если есть ID тегов которые нужно удалить
        if (updatePostDto.remove_tag_ids) {
            // Одновременно очищаем от тех, что нужно удалить
            post.tags = [...(post.tags || [])?.filter(tag => !updatePostDto.remove_tag_ids.includes(tag.id))]
        }

        // Загружаем новые медиа
        if (media) {
            const addMedia = await this.mediaInfoService.uploadFiles(media, userId, MediaEntitySourceType.PUBLICATION)
            post.media = [...(post.media || []), ...addMedia]
        }

        // Загружаем новые голосовые сообщения
        if (voices) {
            const addVoices = await this.mediaInfoService.uploadFiles(voices, userId, MediaEntitySourceType.PUBLICATION, MediaItemType.VOICE)
            post.voices = [...(post.voices || []), ...addVoices]
        }

        // Загружаем новые видео-сообщения
        if (videos) {
            const addVideos = await this.mediaInfoService.uploadFiles(videos, userId, MediaEntitySourceType.PUBLICATION,  MediaItemType.SHORTS)
            post.videos = [...(post.videos || []), ...addVideos]
        }

        if (updatePostDto.scheduled_publish_time) {
            post.visibility = PostVisibility.PRIVATE
        }

        // Удаляем медиа если есть
        if (updatePostDto.remove_media_ids) {
            post.media = (post.media || []).filter((media) => !updatePostDto.remove_media_ids.includes(media.id))
        }
        // Удаляем видео сообщения если есть
        if (updatePostDto.remove_video_ids) {
            post.videos = (post.videos || []).filter((video) => !updatePostDto.remove_video_ids.includes(video.id))
        }
        // Удаляем голосовые сообщения если есть
        if (updatePostDto.remove_voice_ids) {
            post.voices = (post.voices || []).filter((voice) => !updatePostDto.remove_voice_ids.includes(voice.id))
        }

        post.is_edited = true
        return this.postRepository.save(post)
    }


    async findAll(query: FindPostDto, params: RequestParams) {

        let ownerId: number

        if (query?.owner_public_id) {
            const owner = await this.userInfoService.getUsersByParams({ public_id: query.owner_public_id }, params)
            ownerId = owner.id
        } else {
            ownerId = params.user_info_id
        }

        const queryOptions = createPaginationQueryOptions<PostEntity>({
            query: omit(query, 'owner_public_id'),
            options: {
                where: { author: { id: ownerId } },
                relations: [
                    'media',
                    'media.meta',
                    'tags',
                    'original_post',
                    'reply_to',
                    'forwarded_post',
                    'voices',
                    'voices.meta',
                    'videos',
                    'videos.meta',
                    'author',
                    'reactions',
                    'reactions.reaction',
                    'reactions.user',
                ]
            }
        })

        if (!query.sort_by) {
            queryOptions.order = { date_created: SortDirection.ASC }
        }

        const [posts, total] = await this.postRepository.findAndCount(queryOptions)

        const postsResponse = posts.map(post => {
            const reactionCounts = post.reactions.reduce((acc, reaction) => {
                const reactionName = reaction.reaction.name
                acc[reactionName] = (acc[reactionName] || 0) + 1
                return acc
            }, {} as Record<string, number>)

            const userReaction = post.reactions.find(reaction => reaction.user.id === params.user_info_id)

            const reactionInfo: CalculateReactionsResponse = {
                counts: reactionCounts,
                my_reaction: userReaction ? userReaction.reaction.name : null
            }

            const postResponse: PostResponseDto = {
                id: post.id,
                text: post.text,
                date_created: post.date_created,
                date_updated: post.date_updated,
                author: post.author,
                title: post.title,
                count_views: post.count_views,
                repost_count: post.repost_count,
                is_repost: post.is_repost,
                voices: post.voices,
                videos: post.videos,
                media: post.media,
                visibility: post.visibility,
                pinned: post.pinned,
                location: post.location,
                comments_count: post.comments_count,
                reaction_info: reactionInfo,
            }
            return postResponse
        })

        return createPaginationResponse({ data: postsResponse, total, query })
}

    async findOne(id: string){
        const post = await this.postRepository.findOne({
            where: { id },
            relations: [
                'media',          // Загружаем медиа
                'media.meta',     // Загружаем метаданные для каждого медиа-файла
                'tags',           // Теги поста
                'original_post',  // Оригинальный пост (если репост)
                'reply_to',       // Ответы
                'forwarded_post', // Пересланные посты
                'voices',         // Аудио файлы
                'voices.meta',    // Метаданные для аудио
                'videos',         // Видео файлы
                'videos.meta',    // Метаданные для видео
                'author',         // Автор
                'reactions',      // Реакции
                'reactions.reaction',      // Реакции
            ]
        })
        if (!post) {
            throw new NotFoundException(`Пост с ID "${id}" не найден`)
        }
        /**
         * Считаем кол-во комментариев для поста
         */
        const { commentCount } = await this.postRepository
          .createQueryBuilder('post')
          .leftJoin('post.comments', 'comment')
          .where('post.id = :id', { id })
          .select('COUNT(comment.id)', 'commentCount')
          .getRawOne()

        post.comments_count = parseInt(commentCount) || 0

        return post
    }


    async remove(id: string, params: RequestParams) {
        const post = await this.postRepository.findOne({ where: { id }, relations: ['media'] })
        if (post.media && post.media.length > 0) {
            for (const media of post.media) {
                await this.mediaInfoService.deleteFile(media.id, params)
            }
        }

        await this.postRepository.remove(post)
    }

    /**
     * Увеличение счетчика просмотров
     */
    async incrementViewCount(id: string) {
        await this.postRepository.increment({ id }, 'count_views', 1)
    }

    /**
     * Увеличение счетчика репостов
     */
    async incrementRepostCount(id: string) {
        await this.postRepository.increment({ id }, 'repost_count', 1)
    }

    /**
     * Создание репоста
     */
    async createRepost(originalPostId: string, params: RequestParams, text?: string) {
        const author = await this.userInfoService.getUsersById(params.user_info_id)

        const originalPost = await this.findOne(originalPostId)
        const repost = this.postRepository.create({
            original_post: originalPost,
            is_repost: true,
            text: text || originalPost.text,
            author,
        })
        await this.incrementRepostCount(originalPostId)
        return this.postRepository.save(repost)
    }

    /**
     * Создание ответа на пост
     */
    async createReply(
        replyToId: string,
        { videos, voices, createPostDto, media }: { createPostDto: CreatePostDto, media: Express.Multer.File[], voices: Express.Multer.File[], videos: Express.Multer.File[] },
        params: RequestParams
    ) {
        const replyTo = await this.findOne(replyToId)
        return this.create({ createPostDto: {...createPostDto, reply_to: replyTo}, media, videos, voices }, params)
    }

    /**
     * Получение закрепленных постов
     */
    async getPinnedPosts(userId: number) {
        return this.postRepository.find({
            where: { pinned: true, author: { id: userId } },
            relations: ['media', 'tags']
        })
    }

    /**
     * Закрепление/открепление поста
     */
    async togglePinPost(postId: string, userId: number) {
        const post = await this.findOne(postId)
        if (post.author.id !== userId) {
            throw new BadRequestException('You can only pin/unpin your own posts')
        }
        post.pinned = !post.pinned
        return this.postRepository.save(post)
    }

    /**
     * Получение запланированных постов
     */
    async getScheduledPosts() {
        const now = new Date()
        return this.postRepository.find({
            where: {
                scheduled_publish_time: LessThanOrEqual(now),
                visibility: PostVisibility.PRIVATE // Предполагаем, что запланированные посты изначально приватны
            },
            relations: ['media', 'tags', 'reactions']
        })
    }

    /**
     * Публикация запланированных постов
     */
    async publishScheduledPosts() {
        const scheduledPosts = await this.getScheduledPosts()
        for (const post of scheduledPosts) {
            post.visibility = PostVisibility.PUBLIC
            post.scheduled_publish_time = null
            await this.postRepository.save(post)
        }
        return scheduledPosts
    }

    /**
     * Изменение видимости поста
     */
    async updatePostVisibility(postId: string, visibility: PostVisibility, userId: number) {
        const post = await this.findOne(postId)
        if (post.author.id !== userId) {
            throw new BadRequestException('You can only change visibility of your own posts')
        }
        post.visibility = visibility
        return this.postRepository.save(post)
    }

    /**
     * Создание пересылки поста
     */
    async createForwardedPost(forwardedPostId: string, params: RequestParams, text?: string) {
        const author = await this.userInfoService.getUsersById(params.user_info_id)

        const forwardedPost = await this.findOne(forwardedPostId)
        const newPost = this.postRepository.create({
            forwarded_post: forwardedPost,
            text: text || forwardedPost.text,
            author,
            type: PublicationType.POST
        })
        return this.postRepository.save(newPost)
    }

    /**
     * Получение всех медиафайлов поста (включая голосовые и видео)
     */
    async getAllMediaForPost(postId: string) {
        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: ['media', 'voices', 'videos']
        })

        if (!post) {
            throw new NotFoundException(`Post with ID "${postId}" not found`)
        }

        return {
            media: post.media || [],
            voices: post.voices || [],
            videos: post.videos || []
        }
    }

    /**
     * Обновление местоположения поста
     */
    async updatePostLocation(postId: string, location: string, userId: number) {
        const post = await this.findOne(postId)
        if (post.author.id !== userId) {
            throw new BadRequestException('You can only update the location of your own posts')
        }
        post.location = location
        return this.postRepository.save(post)
    }

    /**
     * Получение постов по местоположению
     */
    async getPostsByLocation(location: string) {
        return this.postRepository.find({
            where: { location },
            relations: ['media', 'tags', 'original_post', 'reply_to', 'forwarded_post', 'voices', 'videos']
        })
    }

    /**
     * Получение репостов конкретного поста
     */
    async getRepostsOfPost(postId: string) {
        return this.postRepository.find({
            where: { original_post: { id: postId } },
            relations: ['author', 'media', 'tags']
        })
    }

    /**
     * Получение ответов на конкретный пост
     */
    async getRepliesOfPost(postId: string) {
        return this.postRepository.find({
            where: { reply_to: { id: postId } },
            relations: ['author', 'media', 'tags']
        })
    }

    /**
     * Получение пересылок конкретного поста
     */
    async getForwardsOfPost(postId: string) {
        return this.postRepository.find({
            where: { forwarded_post: { id: postId } },
            relations: ['author', 'media', 'tags']
        })
    }

    /**
     * Получение всех связанных постов (репосты, ответы, пересылки)
     */
    async getAllRelatedPosts(postId: string) {
        const [reposts, replies, forwards] = await Promise.all([
            this.getRepostsOfPost(postId),
            this.getRepliesOfPost(postId),
            this.getForwardsOfPost(postId)
        ])

        return {
            reposts,
            replies,
            forwards
        }
    }

    /**
     * Получение цепочки ответов
     */
    async getReplyChain(postId: string) {
        const post = await this.findOne(postId)
        const chain = [post]

        let currentPost = post
        while (currentPost.reply_to) {
            currentPost = await this.findOne(currentPost.reply_to.id)
            chain.unshift(currentPost)
        }

        return chain
    }

    /**
     * Добавляет счетчик комментариев
     */
    async incrementCommentCount(id: string, requestParams?: RequestParams) {
        const findMedia = await this.postRepository.findOne({
            where: { id },
        })

        findMedia.comments_count++
        await this.postRepository.save(findMedia)
    }

    /**
     * Убавляет счетчик комментариев
     */
    async decrementCommentCount(id: string, requestParams?: RequestParams) {
        const findMedia = await this.postRepository.findOne({
            where: { id },
        })

        if (findMedia.comments_count > 0) {
            findMedia.comments_count--
            await this.postRepository.save(findMedia)
        }
    }
}
