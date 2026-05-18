import { IsString, IsNumber, IsOptional, IsPositive } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class CreateBookingDto {
  @ApiProperty() @IsString() professionalId: string
  @ApiProperty() @IsString() date: string
  @ApiProperty() @IsString() startTime: string
  @ApiProperty() @IsString() endTime: string
  @ApiProperty() @IsNumber() @IsPositive() durationHours: number
  @ApiPropertyOptional() @IsOptional() @IsString() location?: string
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string
}
