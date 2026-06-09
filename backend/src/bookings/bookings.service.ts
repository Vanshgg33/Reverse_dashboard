import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery, Types } from 'mongoose';
import { Booking, BookingDocument, BookingStatus, CollectionType } from './schemas/booking.schema';
import { BookingActivity, BookingActivityDocument } from './schemas/booking-activity.schema';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-status.dto';
import { AssignBookingDto } from './dto/assign-booking.dto';

export interface BookingFilters {
  status?: BookingStatus;
  collectionType?: CollectionType;
  search?: string;
  isHighPriority?: boolean;
  page?: number;
  limit?: number;
}

// Explicit state machine — terminal states return empty array
const STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.ASSIGNED, BookingStatus.CANCELLED],
  [BookingStatus.ASSIGNED]: [
    BookingStatus.COLLECTED,
    BookingStatus.PENDING,
    BookingStatus.CANCELLED,
  ],
  [BookingStatus.COLLECTED]: [],
  [BookingStatus.CANCELLED]: [],
};

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
    @InjectModel(BookingActivity.name)
    private activityModel: Model<BookingActivityDocument>,
  ) {}

  async create(dto: CreateBookingDto): Promise<any> {
    const isHighPriority = dto.estimatedPackageCount > 100;

    const booking = await this.bookingModel.create({
      customerName: dto.customerName,
      phoneNumber: dto.phoneNumber,
      email: dto.email,
      address: dto.address,
      collectionType: dto.collectionType,
      estimatedPackageCount: dto.estimatedPackageCount,
      preferredCollectionDate: new Date(dto.preferredCollectionDate),
      notes: dto.notes ?? null,
      isHighPriority,
      status: BookingStatus.PENDING,
    });

    const activity = await this.activityModel.create({
      bookingId: booking._id,
      event: 'BOOKING_CREATED',
      description: `Collection booking created for ${dto.customerName}`,
      metadata: {
        collectionType: dto.collectionType,
        estimatedPackageCount: dto.estimatedPackageCount,
        isHighPriority,
      },
    });

    this.logger.log(`Booking created: ${booking._id} (highPriority=${isHighPriority})`);

    // Return response directly from created documents — avoids a second DB round-trip
    return { ...booking.toJSON(), activities: [activity.toJSON()] };
  }

  async findAll(filters: BookingFilters = {}) {
    const { status, collectionType, search, isHighPriority, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const query: FilterQuery<BookingDocument> = {};
    if (status) query.status = status;
    if (collectionType) query.collectionType = collectionType;
    if (isHighPriority !== undefined) query.isHighPriority = isHighPriority;

    if (search) {
      const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [
        { customerName: regex },
        { email: regex },
        { phoneNumber: regex },
        { address: regex },
      ];
    }

    const [docs, total] = await Promise.all([
      this.bookingModel
        .find(query)
        .sort({ isHighPriority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.bookingModel.countDocuments(query),
    ]);

    return {
      data: docs.map((d) => d.toJSON()),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<any> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException(`Booking #${id} not found`);
    }

    const [booking, activities] = await Promise.all([
      this.bookingModel.findById(id).exec(),
      this.activityModel.find({ bookingId: new Types.ObjectId(id) }).sort({ createdAt: 1 }).exec(),
    ]);

    if (!booking) throw new NotFoundException(`Booking #${id} not found`);

    return {
      ...booking.toJSON(),
      activities: activities.map((a) => a.toJSON()),
    };
  }

  async updateStatus(id: string, dto: UpdateBookingStatusDto): Promise<any> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) throw new NotFoundException(`Booking #${id} not found`);

    const allowed = STATUS_TRANSITIONS[booking.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot transition from ${booking.status} to ${dto.status}. ` +
          `Allowed: ${allowed.length ? allowed.join(', ') : 'none'}`,
      );
    }

    const prevStatus = booking.status;
    booking.status = dto.status;
    await booking.save();

    await this.activityModel.create({
      bookingId: booking._id,
      event: 'STATUS_UPDATED',
      description: `Status changed from ${prevStatus} to ${dto.status}`,
      metadata: { from: prevStatus, to: dto.status },
    });

    return this.findOne(id);
  }

  async assign(id: string, dto: AssignBookingDto): Promise<any> {
    const booking = await this.bookingModel.findById(id).exec();
    if (!booking) throw new NotFoundException(`Booking #${id} not found`);

    if (
      booking.status === BookingStatus.COLLECTED ||
      booking.status === BookingStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot assign a booking with status ${booking.status}`,
      );
    }

    booking.agentName = dto.agentName;
    booking.vehicleId = dto.vehicleId;
    booking.status = BookingStatus.ASSIGNED;
    await booking.save();

    await this.activityModel.create({
      bookingId: booking._id,
      event: 'ASSIGNED_TO_AGENT',
      description: `Assigned to agent ${dto.agentName} (vehicle: ${dto.vehicleId})`,
      metadata: { agentName: dto.agentName, vehicleId: dto.vehicleId },
    });

    return this.findOne(id);
  }
}
