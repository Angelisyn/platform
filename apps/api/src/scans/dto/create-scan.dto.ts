import { IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ScanType } from '@prisma/client';

export class CreateScanDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsString()
  @IsNotEmpty()
  targetId!: string;

  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @IsEnum(ScanType)
  scanType!: ScanType;
}
