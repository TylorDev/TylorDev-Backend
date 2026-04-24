import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from '../shared/dtos';
import { SUPPORTED_LOCALES, SupportedLocale } from '../shared/locales';
import { getProjectHeaderMessage } from '../shared/project-header-message';
import { createBaseSlug, createSlugSuffix, getPrimaryTitle } from '../shared/slug.utils';

const projectInclude = {
  translations: true,
  buttons: {
    include: {
      translations: true,
    },
  },
  sections: {
    include: {
      translations: true,
    },
    orderBy: {
      order: 'asc',
    },
  },
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const projects = await this.prisma.project.findMany({
      include: projectInclude,
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((project) => this.toResponse(project));
  }

  async findOne(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: projectInclude,
    });

    if (!project) {
      throw new NotFoundException(`Project ${slug} was not found`);
    }

    return this.toResponse(project);
  }

  async create(dto: CreateProjectDto) {
    const resolvedSlug = await this.createUniqueSlug(getPrimaryTitle(dto.translations));
    const project = await this.prisma.project.create({
      data: this.toCreateInput(this.withAutomaticHeaderMessage(dto), resolvedSlug),
      include: projectInclude,
    });

    return this.toResponse(project);
  }

  async update(slug: string, dto: UpdateProjectDto) {
    await this.ensureExists(slug);
    const normalizedDto = this.withAutomaticHeaderMessage(dto);
    const resolvedSlug = await this.createUniqueSlug(getPrimaryTitle(dto.translations), slug);

    const project = await this.prisma.project.update({
      where: { slug },
      data: {
        slug: resolvedSlug,
        publishedAt: normalizedDto.publishedAt ? new Date(normalizedDto.publishedAt) : null,
        coverImageSrc: normalizedDto.coverImageSrc,
        coverImageAlt: normalizedDto.coverImageAlt,
        backgroundImage: normalizedDto.backgroundImage,
        backgroundAlt: normalizedDto.backgroundAlt,
        translations: {
          deleteMany: {},
          create: normalizedDto.translations,
        },
        buttons: {
          deleteMany: {},
          create: normalizedDto.buttons.map((button, index) => ({
            order: index,
            icon: button.icon,
            url: button.url,
            translations: {
              create: button.translations,
            },
          })),
        },
        sections: {
          deleteMany: {},
          create: normalizedDto.sections.map((section, index) => ({
            order: index,
            flexDirection: section.flexDirection,
            coverImage: section.coverImage,
            translations: {
              create: section.translations.map((translation) => ({
                locale: translation.locale,
                summary: translation.summary,
                readMore: translation.readMore,
                modalContent: translation.modalContent,
                close: translation.close,
              })),
            },
          })),
        },
      },
      include: projectInclude,
    });

    return this.toResponse(project);
  }

  async remove(slug: string) {
    await this.ensureExists(slug);
    await this.prisma.project.delete({ where: { slug } });
    return { success: true };
  }

  private async ensureExists(slug: string) {
    const project = await this.prisma.project.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(`Project ${slug} was not found`);
    }
  }

  private toCreateInput(dto: CreateProjectDto, slug: string): Prisma.ProjectCreateInput {
    return {
      slug,
      publishedAt: dto.publishedAt ? new Date(dto.publishedAt) : null,
      coverImageSrc: dto.coverImageSrc,
      coverImageAlt: dto.coverImageAlt,
      backgroundImage: dto.backgroundImage,
      backgroundAlt: dto.backgroundAlt,
      translations: {
        create: dto.translations,
      },
      buttons: {
        create: dto.buttons.map((button, index) => ({
          order: index,
          icon: button.icon,
          url: button.url,
          translations: {
            create: button.translations,
          },
        })),
      },
      sections: {
        create: dto.sections.map((section, index) => ({
          order: index,
          flexDirection: section.flexDirection,
          coverImage: section.coverImage,
          translations: {
            create: section.translations.map((translation) => ({
              locale: translation.locale,
              summary: translation.summary,
              readMore: translation.readMore,
              modalContent: translation.modalContent,
              close: translation.close,
            })),
          },
        })),
      },
    };
  }

  private withAutomaticHeaderMessage<T extends CreateProjectDto | UpdateProjectDto>(dto: T): T {
    return {
      ...dto,
      translations: dto.translations.map((translation) => ({
        ...translation,
        message: getProjectHeaderMessage(translation.locale as SupportedLocale),
      })),
    };
  }

  private toResponse(project: Prisma.ProjectGetPayload<{ include: typeof projectInclude }>) {
    const translationsByLocale = Object.fromEntries(
      project.translations.map((translation) => [translation.locale, translation]),
    );

    return {
      id: project.id,
      slug: project.slug,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      publishedAt: project.publishedAt,
      shared: {
        coverImageSrc: project.coverImageSrc,
        coverImageAlt: project.coverImageAlt,
        backgroundImage: project.backgroundImage,
        backgroundAlt: project.backgroundAlt,
        buttons: project.buttons
          .sort((a, b) => a.order - b.order)
          .map((button) => {
            const buttonTranslationsByLocale = Object.fromEntries(
              button.translations.map((translation) => [translation.locale, translation]),
            );

            return {
              icon: button.icon,
              url: button.url,
              translations: SUPPORTED_LOCALES.map((locale) => ({
                locale,
                text: buttonTranslationsByLocale[locale]?.text ?? '',
              })),
            };
          }),
      },
      translations: SUPPORTED_LOCALES.map((locale) => {
        const translation = translationsByLocale[locale];
        return {
          locale,
          title: translation?.title ?? '',
          status: translation?.status ?? '',
          type: translation?.type ?? '',
          tags: translation?.tags ?? '',
          message: translation?.message ?? '',
          subtitle: translation?.subtitle ?? '',
        };
      }),
      sections: project.sections.map((section) => {
        const sectionTranslationsByLocale = Object.fromEntries(
          section.translations.map((translation) => [translation.locale, translation]),
        );

        return {
          id: section.id,
          flexDirection: section.flexDirection,
          coverImage: section.coverImage,
          translations: SUPPORTED_LOCALES.map((locale) => {
            const translation = sectionTranslationsByLocale[locale];
            return {
              locale,
              summary: translation?.summary ?? '',
              readMore: translation?.readMore ?? '',
              modalContent: translation?.modalContent ?? '',
              close: translation?.close ?? '',
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
      const existing = await this.prisma.project.findUnique({
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
