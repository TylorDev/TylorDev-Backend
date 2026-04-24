import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ArticlesModule } from './articles/articles.module';

@Module({
  imports: [PrismaModule, ProjectsModule, ArticlesModule],
})
export class AppModule {}
