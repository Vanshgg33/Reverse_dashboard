import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export enum CollectionType {
  HOUSEHOLD = 'HOUSEHOLD',
  APARTMENT = 'APARTMENT',
  OFFICE = 'OFFICE',
  RETAIL_STORE = 'RETAIL_STORE',
  RESTAURANT_CAFE = 'RESTAURANT_CAFE',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  COLLECTED = 'COLLECTED',
  CANCELLED = 'CANCELLED',
}

export type BookingDocument = HydratedDocument<Booking>;

@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_, ret: Record<string, any>) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Booking {
  @Prop({ required: true })
  customerName: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true, enum: Object.values(CollectionType) })
  collectionType: CollectionType;

  @Prop({ required: true, min: 1, max: 10000 })
  estimatedPackageCount: number;

  @Prop({ required: true })
  preferredCollectionDate: Date;

  @Prop({ default: null })
  notes: string;

  @Prop({ enum: Object.values(BookingStatus), default: BookingStatus.PENDING })
  status: BookingStatus;

  @Prop({ default: false })
  isHighPriority: boolean;

  @Prop({ default: null })
  agentName: string;

  @Prop({ default: null })
  vehicleId: string;

  createdAt: Date;
  updatedAt: Date;
}

export const BookingSchema = SchemaFactory.createForClass(Booking);

BookingSchema.index({ status: 1 });
BookingSchema.index({ collectionType: 1 });
BookingSchema.index({ isHighPriority: 1 });
BookingSchema.index({ createdAt: -1 });
