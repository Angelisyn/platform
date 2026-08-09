import { IsString, MinLength } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  provider: string;

  @IsString()
  @MinLength(1)
  model: string;

  @IsString()
  @MinLength(1)
  projectId: string;
}
