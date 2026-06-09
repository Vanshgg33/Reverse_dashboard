import {
  IsString,
  IsEmail,
  IsEnum,
  IsInt,
  IsDateString,
  IsOptional,
  MinLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollectionType } from '../schemas/booking.schema';

export class CreateBookingDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @MinLength(2)
  customerName: string;

  @ApiProperty({ example: '+91 98765 43210' })
  @IsString()
  @Matches(/^[+\d\s\-(]{7,20}$/, { message: 'Invalid phone number format' })
  phoneNumber: string;

  @ApiProperty({ example: 'priya@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '42 Green Park, New Delhi, DL 110016' })
  @IsString()
  @MinLength(10)
  address: string;

  @ApiProperty({ enum: CollectionType, example: CollectionType.HOUSEHOLD })
  @IsEnum(CollectionType)
  collectionType: CollectionType;

  @ApiProperty({ example: 25, minimum: 1, maximum: 10000 })
  @IsInt()
  @Min(1)
  @Max(10000)
  estimatedPackageCount: number;

  @ApiProperty({ example: '2024-03-20' })
  @IsDateString()
  preferredCollectionDate: string;

  @ApiPropertyOptional({ example: 'Please call before arriving' })
  @IsOptional()
  @IsString()
  notes?: string;
}
