import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto } from '../shared/dtos';
import { SUPPORTED_LOCALES } from '../shared/locales';
import { createBaseSlug, createSlugSuffix, getPrimaryTitle } from '../shared/slug.utils';

const articleInclude = {
  translations: true,
  sections: {
    include: {
      translations: true,
    },
    orderBy: {
      order: 'asc',
    },
  },
} satisfies Prisma.ArticleInclude;

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const articles = await this.prisma.article.findMany({
      include: articleInclude,
      orderBy: { createdAt: 'desc' },
    });

    return articles.map((article) => this.toResponse(article));
  }

  async findOne(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      include: articleInclude,
    });

    if (!article) {
      throw new NotFoundException(`Article ${slug} was not found`);
    }

    return this.toResponse(article);
  }

  async create(dto: CreateArticleDto) {
    const resolvedSlug = await this.createUniqueSlug(getPrimaryTitle(dto.translations));
    const article = await this.prisma.article.create({
      data: this.toCreateInput(dto, resolvedSlug),
      include: articleInclude,
    });

    return this.toResponse(article);
  }

  async update(slug: string, dto: UpdateArticleDto) {
    await this.ensureExists(slug);
    const resolvedSlug = await this.createUniqueSlug(getPrimaryTitle(dto.translations), slug);

    const article = await this.prisma.article.update({
      where: { slug },
      data: {
        slug: resolvedSlug,
        publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
        coverImageSrc: dto.coverImageSrc,
        bannerImage: dto.bannerImage,
        researchStyleBorderTop: dto.researchStyle.borderTop,
        researchStyleBorderBottom: dto.researchStyle.borderBottom,
        translations: {
          deleteMany: {},
          create: dto.translations,
        },
        sections: {
          deleteMany: {},
          create: dto.sections.map((section, index) => ({
            order: index,
            image: section.image ?? null,
            translations: {
              create: section.translations.map((translation) => ({
                locale: translation.locale,
                title: translation.title,
                paragraph: translation.paragraph,
              })),
            },
          })),
        },
      },
      include: articleInclude,
    });

    return this.toResponse(article);
  }

  async remove(slug: string) {
    await this.ensureExists(slug);
    await this.prisma.article.delete({ where: { slug } });
    return { success: true };
  }

  private async ensureExists(slug: string) {
    const article = await this.prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundException(`Article ${slug} was not found`);
    }
  }

  private toCreateInput(dto: CreateArticleDto, slug: string): Prisma.ArticleCreateInput {
    return {
      slug,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
      coverImageSrc: dto.coverImageSrc,
      bannerImage: dto.bannerImage,
      researchStyleBorderTop: dto.researchStyle.borderTop,
      researchStyleBorderBottom: dto.researchStyle.borderBottom,
      translations: {
        create: dto.translations,
      },
      sections: {
        create: dto.sections.map((section, index) => ({
          order: index,
          image: section.image ?? null,
          translations: {
            create: section.translations.map((translation) => ({
              locale: translation.locale,
              title: translation.title,
              paragraph: translation.paragraph,
            })),
          },
        })),
      },
    };
  }

  private toResponse(article: Prisma.ArticleGetPayload<{ include: typeof articleInclude }>) {
    const translationsByLocale = Object.fromEntries(
      article.translations.map((translation) => [translation.locale, translation]),
    );

    return {
      id: article.id,
      slug: article.slug,
      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      publishedAt: article.publishedAt,
      shared: {
        coverImageSrc: article.coverImageSrc,
        bannerImage: article.bannerImage,
        researchStyle: {
          borderTop: article.researchStyleBorderTop,
          borderBottom: article.researchStyleBorderBottom,
        },
      },
      translations: SUPPORTED_LOCALES.map((locale) => {
        const translation = translationsByLocale[locale];
        return {
          locale,
          category: translation?.category ?? '',
          title: translation?.title ?? '',
          content: translation?.content ?? '',
          contentTitle: translation?.contentTitle ?? '',
        };
      }),
      sections: article.sections.map((section) => {
        const sectionTranslationsByLocale = Object.fromEntries(
          section.translations.map((translation) => [translation.locale, translation]),
        );

        return {
          id: section.id,
          image: section.image,
          translations: SUPPORTED_LOCALES.map((locale) => {
            const translation = sectionTranslationsByLocale[locale];
            return {
              locale,
              title: translation?.title ?? '',
              paragraph: translation?.paragraph ?? '',
            };
          }),
        };
      }),
    };
  }

  private async createUniqueSlug(title: string, currentSlug?: string) {
    const baseSlug = createBaseSlug(title);
    let candidate = baseSlug;

    while (true) {
      const existing = await this.prisma.article.findUnique({
        where: { slug: candidate },
        select: { id: true, slug: true },
      });

      if (!existing || existing.slug === currentSlug) {
        return candidate;
      }

      candidate = `${baseSlug}-${createSlugSuffix()}`;
    }
  }
}
