import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BookingActivityDocument = HydratedDocument<BookingActivity>;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  toJSON: {
    virtuals: true,
    transform: (_, ret: Record<string, any>) => {
      ret.id = ret._id?.toString();
      ret.bookingId = ret.bookingId?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class BookingActivity {
  @Prop({ type: Types.ObjectId, ref: 'Booking', required: true, index: true })
  bookingId: Types.ObjectId;

  @Prop({ required: true })
  event: string;

  @Prop({ default: null })
  description: string;

  @Prop({ type: Object, default: null })
  metadata: Record<string, unknown>;

  createdAt: Date;
}

export const BookingActivitySchema = SchemaFactory.createForClass(BookingActivity);
