import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ArticlesModule } from './articles/articles.module';

@Module({
  controllers: [AppController],
  imports: [PrismaModule, AuthModule, ProjectsModule, ArticlesModule],
})
export class AppModule {}
