import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '../schemas/booking.schema';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: BookingStatus, example: BookingStatus.ASSIGNED })
  @IsEnum(BookingStatus)
  status: BookingStatus;
}
