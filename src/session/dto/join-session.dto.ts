import { IsString, MaxLength, MinLength } from 'class-validator';

export class JoinSessionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  displayName: string;
}
