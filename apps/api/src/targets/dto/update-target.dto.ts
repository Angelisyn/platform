import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TargetStatus, TargetType } from '@prisma/client';

export class UpdateTargetDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  target?: string;

  @IsOptional()
  @IsEnum(TargetType)
  type?: TargetType;

  @IsOptional()
  @IsEnum(TargetStatus)
  status?: TargetStatus;
}
