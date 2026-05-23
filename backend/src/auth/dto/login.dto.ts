import { IsEmail, IsString, IsOptional } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty() @IsEmail() email: string
  @ApiProperty() @IsString() password: string

  @ApiPropertyOptional({
    description: 'TOTP token from authenticator app (required if MFA is enabled). Backup codes also accepted.',
  })
  @IsOptional()
  @IsString()
  mfaToken?: string
}
