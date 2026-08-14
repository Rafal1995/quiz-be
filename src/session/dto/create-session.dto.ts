import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateSessionDto {
  @IsString()
  hostDisplayName: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(20)
  maxPlayers?: number;
}
