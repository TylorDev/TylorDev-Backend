import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto } from '../shared/dtos';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll() {
    return this.projectsService.findAll();
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.projectsService.findOne(slug);
  }

  @Post()
  create(@Body() dto: CreateProjectDto) {
    return this.projectsService.create(dto);
  }

  @Put(':slug')
  update(@Param('slug') slug: string, @Body() dto: UpdateProjectDto) {
    return this.projectsService.update(slug, dto);
  }

  @Delete(':slug')
  remove(@Param('slug') slug: string) {
    return this.projectsService.remove(slug);
  }
}
