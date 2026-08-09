import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { TargetType } from '@prisma/client';

export class CreateTargetDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  target!: string;

  @IsEnum(TargetType)
  type!: TargetType;

  @IsString()
  @IsNotEmpty()
  projectId!: string;
}
