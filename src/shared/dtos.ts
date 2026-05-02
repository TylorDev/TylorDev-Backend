import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SUPPORTED_LOCALES } from './locales';

export class TranslationDto {
  @IsIn(SUPPORTED_LOCALES)
  locale!: string;
}

export class ProjectTranslationDto extends TranslationDto {
  @IsOptional()
  @IsString()
  subtitle?: string;
}



export class ProjectButtonDto {
  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectButtonTranslationDto)
  translations?: ProjectButtonTranslationDto[];
}

export class ProjectButtonTranslationDto extends TranslationDto {
  @IsOptional()
  @IsString()
  text?: string;
}

export class ProjectSectionTranslationDto extends TranslationDto {
  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  readMore?: string;

  @IsOptional()
  @IsString()
  modalContent?: string;

  @IsOptional()
  @IsString()
  close?: string;
}

export class ProjectSectionDto {
  @IsOptional()
  @IsString()
  flexDirection?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectSectionTranslationDto)
  translations?: ProjectSectionTranslationDto[];
}

export class CreateProjectDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsString()
  coverImageSrc!: string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsString()
  technologies?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProjectTranslationDto)
  translations!: ProjectTranslationDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectButtonDto)
  buttons?: ProjectButtonDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectSectionDto)
  sections?: ProjectSectionDto[];
}

export class UpdateProjectDto extends CreateProjectDto {}

export class ArticleTranslationDto extends TranslationDto {
  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  contentTitle?: string;
}

export class ArticleSectionTranslationDto extends TranslationDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  paragraph?: string;
}

export class ArticleSectionDto {
  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleSectionTranslationDto)
  translations?: ArticleSectionTranslationDto[];
}

export class ResearchStyleDto {
  @IsOptional()
  @IsString()
  borderTop?: string;

  @IsOptional()
  @IsString()
  borderBottom?: string;
}

export class CreateArticleDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsString()
  coverImageSrc!: string;

  @IsOptional()
  @IsString()
  bannerImage?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ArticleTranslationDto)
  translations!: ArticleTranslationDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ResearchStyleDto)
  researchStyle?: ResearchStyleDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleSectionDto)
  sections?: ArticleSectionDto[];
}

export class UpdateArticleDto extends CreateArticleDto {}
