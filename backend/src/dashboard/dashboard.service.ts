import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingDocument, BookingStatus } from '../bookings/schemas/booking.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Booking.name) private bookingModel: Model<BookingDocument>,
  ) {}

  async getStats(): Promise<any> {
    const [
      totalBookings,
      pending,
      assigned,
      collected,
      cancelled,
      highPriority,
      packageAgg,
      recentDocs,
      typeBreakdown,
    ] = await Promise.all([
      this.bookingModel.countDocuments(),
      this.bookingModel.countDocuments({ status: BookingStatus.PENDING }),
      this.bookingModel.countDocuments({ status: BookingStatus.ASSIGNED }),
      this.bookingModel.countDocuments({ status: BookingStatus.COLLECTED }),
      this.bookingModel.countDocuments({ status: BookingStatus.CANCELLED }),
      this.bookingModel.countDocuments({ isHighPriority: true, status: { $in: [BookingStatus.PENDING, BookingStatus.ASSIGNED] } }),

      this.bookingModel.aggregate<{ avg: number; sum: number }>([
        {
          $group: {
            _id: null,
            avg: { $avg: '$estimatedPackageCount' },
            sum: { $sum: '$estimatedPackageCount' },
          },
        },
      ]),

      this.bookingModel
        .find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('customerName collectionType status isHighPriority estimatedPackageCount createdAt')
        .lean()
        .exec(),

      this.bookingModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$collectionType', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ]);

    return {
      totalBookings,
      pending,
      assigned,
      collected,
      cancelled,
      highPriority,
      averagePackagesPerBooking: Math.round(packageAgg[0]?.avg ?? 0),
      totalPackages: packageAgg[0]?.sum ?? 0,
      recentBookings: recentDocs.map((d) => ({
        ...d,
        id: (d as any)._id.toString(),
        _id: undefined,
      })),
      collectionTypeBreakdown: typeBreakdown.map((b) => ({
        type: b._id,
        count: b.count,
      })),
    };
  }
}
