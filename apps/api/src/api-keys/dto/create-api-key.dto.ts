import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateApiKeyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsString()
  provider: string;

  @IsNotEmpty()
  @IsString()
  key: string;
}
