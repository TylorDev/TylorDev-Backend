import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      publishedAt: true
    }
  });
  console.log(projects);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
