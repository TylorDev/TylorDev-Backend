import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();
const locales = ['en-us', 'es-mx', 'pt-br'] as const;
const apiRoot =
  process.env.SEED_API_DIR ?? path.resolve(__dirname, '..', '..', 'original', 'src', 'API');
const projectDirectoryByLocale = (locale: string) =>
  path.resolve(apiRoot, locale, 'Projects');
const articleDirectoryByLocale = (locale: string) =>
  path.resolve(apiRoot, locale, 'Articles');

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
}

function getFileNames(directory: string) {
  return fs
    .readdirSync(directory)
    .filter((entry) => entry.endsWith('.json'))
    .sort();
}

function getTechnologies(project: any) {
  const tags = project.data.tags;
  return Array.isArray(tags) ? tags.join(', ') : tags ?? '';
}

async function seedProjects() {
  const slugs = getFileNames(projectDirectoryByLocale('es-mx')).map((file) =>
    file.replace('.json', ''),
  );

  for (const slug of slugs) {
    const projectByLocale = Object.fromEntries(
      locales.map((locale) => [
        locale,
        readJson<any>(path.join(projectDirectoryByLocale(locale), `${slug}.json`)),
      ]),
    );

    await prisma.project.upsert({
      where: { slug },
      update: {
        coverImageSrc: projectByLocale['es-mx'].data.coverImageSrc,
        backgroundImage: projectByLocale['es-mx'].header.backgroundImage,
        status: projectByLocale['es-mx'].data.status ?? '',
        type: projectByLocale['es-mx'].data.type ?? '',
        technologies: getTechnologies(projectByLocale['es-mx']),
        title: projectByLocale['es-mx'].header.title ?? '',
        publishedAt: projectByLocale['es-mx'].data.date
          ? new Date(projectByLocale['es-mx'].data.date)
          : null,
        translations: {
          deleteMany: {},
          create: locales.map((locale) => ({
            locale,
            subtitle: projectByLocale[locale].header.subtitle,
          })),
        },
        buttons: {
          deleteMany: {},
          create: projectByLocale['es-mx'].header.buttons.map((button: any, index: number) => ({
            icon: Boolean(button.icon),
            url: button.url,
            order: index,
            translations: {
              create: locales.map((locale) => ({
                locale,
                text: projectByLocale[locale].header.buttons[index].text,
              })),
            },
          })),
        },
        sections: {
          deleteMany: {},
          create: projectByLocale['es-mx'].sections.map((section: any, index: number) => ({
            order: index,
            flexDirection: section.flexDirection,
            coverImage: section.coverImage,
            translations: {
              create: locales.map((locale) => ({
                locale,
                summary: projectByLocale[locale].sections[index].tmContent.summary,
                readMore: projectByLocale[locale].sections[index].tmContent.readMore,
                modalContent: projectByLocale[locale].sections[index].tmContent.modalContent,
                close: projectByLocale[locale].sections[index].tmContent.close,
              })),
            },
          })),
        },
      },
      create: {
        slug,
        coverImageSrc: projectByLocale['es-mx'].data.coverImageSrc,
        backgroundImage: projectByLocale['es-mx'].header.backgroundImage,
        status: projectByLocale['es-mx'].data.status ?? '',
        type: projectByLocale['es-mx'].data.type ?? '',
        technologies: getTechnologies(projectByLocale['es-mx']),
        title: projectByLocale['es-mx'].header.title ?? '',
        publishedAt: projectByLocale['es-mx'].data.date
          ? new Date(projectByLocale['es-mx'].data.date)
          : null,
        translations: {
          create: locales.map((locale) => ({
            locale,
            subtitle: projectByLocale[locale].header.subtitle,
          })),
        },
        buttons: {
          create: projectByLocale['es-mx'].header.buttons.map((button: any, index: number) => ({
            icon: Boolean(button.icon),
            url: button.url,
            order: index,
            translations: {
              create: locales.map((locale) => ({
                locale,
                text: projectByLocale[locale].header.buttons[index].text,
              })),
            },
          })),
        },
        sections: {
          create: projectByLocale['es-mx'].sections.map((section: any, index: number) => ({
            order: index,
            flexDirection: section.flexDirection,
            coverImage: section.coverImage,
            translations: {
              create: locales.map((locale) => ({
                locale,
                summary: projectByLocale[locale].sections[index].tmContent.summary,
                readMore: projectByLocale[locale].sections[index].tmContent.readMore,
                modalContent: projectByLocale[locale].sections[index].tmContent.modalContent,
                close: projectByLocale[locale].sections[index].tmContent.close,
              })),
            },
          })),
        },
      },
    });
  }
}

async function seedArticles() {
  const slugs = getFileNames(articleDirectoryByLocale('es-mx')).map((file) =>
    file.replace('.json', ''),
  );

  for (const slug of slugs) {
    const articleByLocale = Object.fromEntries(
      locales.map((locale) => [
        locale,
        readJson<any>(path.join(articleDirectoryByLocale(locale), `${slug}.json`)),
      ]),
    );

    await prisma.article.upsert({
      where: { slug },
      update: {
        coverImageSrc: articleByLocale['es-mx'].data.coverImageSrc,
        bannerImage: articleByLocale['es-mx'].bannerImage,
        researchStyleBorderTop:
          articleByLocale['es-mx'].researchProps?.style?.borderTop ?? '2px solid white',
        researchStyleBorderBottom:
          articleByLocale['es-mx'].researchProps?.style?.borderBottom ?? 'none',
        publishedAt: null,
        translations: {
          deleteMany: {},
          create: locales.map((locale) => ({
            locale,
            category: articleByLocale[locale].data.category,
            title: articleByLocale[locale].data.title,
            content: articleByLocale[locale].data.content,
            contentTitle: articleByLocale[locale].contentTitle,
          })),
        },
        sections: {
          deleteMany: {},
          create: articleByLocale['es-mx'].sections.map((section: any, index: number) => ({
            order: index,
            image: section.image || null,
            translations: {
              create: locales.map((locale) => ({
                locale,
                title: articleByLocale[locale].sections[index].tittle ?? '',
                paragraph: articleByLocale[locale].sections[index].paragraph,
              })),
            },
          })),
        },
      },
      create: {
        slug,
        coverImageSrc: articleByLocale['es-mx'].data.coverImageSrc,
        bannerImage: articleByLocale['es-mx'].bannerImage,
        researchStyleBorderTop:
          articleByLocale['es-mx'].researchProps?.style?.borderTop ?? '2px solid white',
        researchStyleBorderBottom:
          articleByLocale['es-mx'].researchProps?.style?.borderBottom ?? 'none',
        publishedAt: null,
        translations: {
          create: locales.map((locale) => ({
            locale,
            category: articleByLocale[locale].data.category,
            title: articleByLocale[locale].data.title,
            content: articleByLocale[locale].data.content,
            contentTitle: articleByLocale[locale].contentTitle,
          })),
        },
        sections: {
          create: articleByLocale['es-mx'].sections.map((section: any, index: number) => ({
            order: index,
            image: section.image || null,
            translations: {
              create: locales.map((locale) => ({
                locale,
                title: articleByLocale[locale].sections[index].tittle ?? '',
                paragraph: articleByLocale[locale].sections[index].paragraph,
              })),
            },
          })),
        },
      },
    });
  }
}

async function main() {
  await seedProjects();
  await seedArticles();
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
