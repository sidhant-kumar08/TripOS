import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class OAuthLoginDto {
  @IsIn(['google', 'facebook', 'apple'])
  provider!: 'google' | 'facebook' | 'apple';

  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  providerId?: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

export class GoogleOAuthCallbackDto {
  @IsString()
  code!: string;

  @IsString()
  redirectUri!: string;
}

export class GoogleVerifyTokenDto {
  @IsString()
  idToken!: string;
}

export class FacebookOAuthCallbackDto {
  @IsString()
  code!: string;

  @IsString()
  redirectUri!: string;
}
