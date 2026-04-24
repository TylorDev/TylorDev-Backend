import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateArticleDto, UpdateArticleDto } from '../shared/dtos';
import { ArticlesService } from './articles.service';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Get()
  findAll() {
    return this.articlesService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findOne(slug);
  }

  @Post()
  @UseGuards(SessionAuthGuard)
  create(@Body() dto: CreateArticleDto) {
    return this.articlesService.create(dto);
  }

  @Put(':slug')
  @UseGuards(SessionAuthGuard)
  update(@Param('slug') slug: string, @Body() dto: UpdateArticleDto) {
    return this.articlesService.update(slug, dto);
  }

  @Delete(':slug')
  @UseGuards(SessionAuthGuard)
  remove(@Param('slug') slug: string) {
    return this.articlesService.remove(slug);
  }
}
