import { ArrayNotEmpty, IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  @MaxLength(4000)
  prompt!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  modelIds!: string[];

  @IsOptional()
  @IsString()
  metadata?: string;
}
