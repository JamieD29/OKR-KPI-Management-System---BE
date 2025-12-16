import { IsEmail, IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  token: string;

  @IsEmail()
  email: string;
}
