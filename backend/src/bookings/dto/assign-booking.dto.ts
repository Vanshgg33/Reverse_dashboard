import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignBookingDto {
  @ApiProperty({ example: 'Ravi Kumar' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  agentName: string;

  @ApiProperty({ example: 'V001' })
  @IsString()
  @Matches(/^[A-Za-z0-9]{2,20}$/, {
    message: 'Vehicle ID must be 2–20 alphanumeric characters',
  })
  vehicleId: string;
}
