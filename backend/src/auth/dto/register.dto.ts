import { IsEmail, IsString, MinLength, IsOptional, IsIn } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class RegisterDto {
  @ApiProperty() @IsEmail() email: string
  @ApiProperty() @IsString() @MinLength(2) name: string
  @ApiProperty() @IsString() @MinLength(8) password: string
  @ApiPropertyOptional() @IsOptional() @IsString() phone?: string
  @ApiPropertyOptional() @IsOptional() @IsIn(['client', 'professional']) role?: string
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string
  @ApiPropertyOptional() @IsOptional() @IsString() state?: string
}
