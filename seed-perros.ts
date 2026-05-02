import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.project.create({
    data: {
      slug: 'perros',
      coverImageSrc: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000',
      coverImageAlt: 'Perro',
      backgroundImage: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=1000',
      backgroundAlt: 'Perro background',
      publishedAt: new Date(),
      translations: {
        create: [
          {
            locale: 'es-mx',
            title: 'Perros',
            status: 'Completado',
            type: 'Mascotas',
            tags: 'Perros, Animales',
            message: 'Un proyecto sobre perros increíbles.',
            subtitle: 'Conoce todo sobre el mejor amigo del hombre.'
          },
          {
            locale: 'en-us',
            title: 'Dogs',
            status: 'Completed',
            type: 'Pets',
            tags: 'Dogs, Animals',
            message: 'A project about amazing dogs.',
            subtitle: 'Learn everything about man\'s best friend.'
          }
        ]
      }
    }
  });
  console.log("Proyecto 'Perros' insertado con éxito.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
