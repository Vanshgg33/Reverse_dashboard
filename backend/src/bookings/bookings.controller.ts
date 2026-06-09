import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { BookingsService, BookingFilters } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-status.dto';
import { AssignBookingDto } from './dto/assign-booking.dto';
import { BookingStatus, CollectionType } from './schemas/booking.schema';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new collection booking' })
  @ApiResponse({ status: 201, description: 'Booking created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async create(@Body() dto: CreateBookingDto): Promise<any> {
    return await this.bookingsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List bookings with optional filters & pagination' })
  @ApiQuery({ name: 'status', enum: BookingStatus, required: false })
  @ApiQuery({ name: 'collectionType', enum: CollectionType, required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name / email / phone / address' })
  @ApiQuery({ name: 'isHighPriority', type: Boolean, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  findAll(
    @Query('status') status?: BookingStatus,
    @Query('collectionType') collectionType?: CollectionType,
    @Query('search') search?: string,
    @Query('isHighPriority') isHighPriority?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: BookingFilters = {
      status,
      collectionType,
      search: search?.trim() || undefined,
      isHighPriority:
        isHighPriority !== undefined ? isHighPriority === 'true' : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? Math.min(parseInt(limit, 10), 100) : 20,
    };
    return this.bookingsService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single booking by ID' })
  @ApiParam({ name: 'id', type: String, description: 'MongoDB ObjectId' })
  @ApiResponse({ status: 200, description: 'Booking found' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  findOne(@Param('id') id: string): Promise<any> {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 400, description: 'Invalid transition' })
  @ApiResponse({ status: 404, description: 'Not found' })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ): Promise<any> {
    return this.bookingsService.updateStatus(id, dto);
  }

  @Post(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a booking to a collection agent' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Booking assigned' })
  @ApiResponse({ status: 400, description: 'Cannot assign in current status' })
  assign(@Param('id') id: string, @Body() dto: AssignBookingDto): Promise<any> {
    return this.bookingsService.assign(id, dto);
  }
}
