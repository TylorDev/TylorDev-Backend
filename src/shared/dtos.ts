import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SUPPORTED_LOCALES } from './locales';

export class TranslationDto {
  @IsIn(SUPPORTED_LOCALES)
  locale!: string;
}

export class ProjectTranslationDto extends TranslationDto {
  @IsString()
  title!: string;

  @IsString()
  status!: string;

  @IsString()
  type!: string;

  @IsString()
  tags!: string;

  @IsOptional()
  @IsString()
  message!: string;

  @IsString()
  subtitle!: string;
}

export class ProjectButtonDto {
  @IsBoolean()
  icon!: boolean;

  @IsUrl()
  url!: string;

  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => ProjectButtonTranslationDto)
  translations!: ProjectButtonTranslationDto[];
}

export class ProjectButtonTranslationDto extends TranslationDto {
  @IsString()
  text!: string;
}

export class ProjectSectionTranslationDto extends TranslationDto {
  @IsString()
  summary!: string;

  @IsString()
  readMore!: string;

  @IsString()
  modalContent!: string;

  @IsString()
  close!: string;
}

export class ProjectSectionDto {
  @IsString()
  flexDirection!: string;

  @IsUrl()
  coverImage!: string;

  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => ProjectSectionTranslationDto)
  translations!: ProjectSectionTranslationDto[];
}

export class CreateProjectDto {
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsUrl()
  coverImageSrc!: string;

  @IsString()
  coverImageAlt!: string;

  @IsUrl()
  backgroundImage!: string;

  @IsString()
  backgroundAlt!: string;

  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => ProjectTranslationDto)
  translations!: ProjectTranslationDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectButtonDto)
  buttons!: ProjectButtonDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectSectionDto)
  sections!: ProjectSectionDto[];
}

export class UpdateProjectDto extends CreateProjectDto {}

export class ArticleTranslationDto extends TranslationDto {
  @IsString()
  category!: string;

  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  contentTitle!: string;
}

export class ArticleSectionTranslationDto extends TranslationDto {
  @IsString()
  title!: string;

  @IsString()
  paragraph!: string;
}

export class ArticleSectionDto {
  @IsOptional()
  @IsUrl()
  image?: string;

  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => ArticleSectionTranslationDto)
  translations!: ArticleSectionTranslationDto[];
}

export class ResearchStyleDto {
  @IsString()
  borderTop!: string;

  @IsString()
  borderBottom!: string;
}

export class CreateArticleDto {
  @IsString()
  slug!: string;

  @IsOptional()
  @IsString()
  publishedAt?: string;

  @IsUrl()
  coverImageSrc!: string;

  @IsUrl()
  bannerImage!: string;

  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => ArticleTranslationDto)
  translations!: ArticleTranslationDto[];

  @ValidateNested()
  @Type(() => ResearchStyleDto)
  researchStyle!: ResearchStyleDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ArticleSectionDto)
  sections!: ArticleSectionDto[];
}

export class UpdateArticleDto extends CreateArticleDto {}
