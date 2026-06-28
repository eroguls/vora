import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'demo@vora.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'demo' })
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_]+$/)
  username!: string;

  @ApiProperty({ example: 'Demo User' })
  @IsString()
  @Length(2, 80)
  displayName!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'demo@vora.local' })
  @IsString()
  emailOrUsername!: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'demo@vora.local' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  @IsString()
  token!: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8)
  password!: string;
}
