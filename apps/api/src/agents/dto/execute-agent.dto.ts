import { IsNotEmpty, IsString } from 'class-validator';

export class ExecuteAgentDto {
  @IsNotEmpty()
  @IsString()
  prompt: string;
}
