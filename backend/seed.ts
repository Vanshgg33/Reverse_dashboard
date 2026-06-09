import 'reflect-metadata';
import * as dotenv from 'dotenv';
import mongoose, { Schema, model, Types } from 'mongoose';
import { CollectionType, BookingStatus } from './src/bookings/schemas/booking.schema';

dotenv.config();

// ── Inline schemas (avoid NestJS DI bootstrap overhead in a seed script) ──

const activitySchema = new Schema(
  {
    bookingId: { type: Types.ObjectId, ref: 'Booking', required: true },
    event: { type: String, required: true },
    description: { type: String, default: null },
    metadata: { type: Object, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const bookingSchema = new Schema(
  {
    customerName: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    collectionType: { type: String, enum: Object.values(CollectionType), required: true },
    estimatedPackageCount: { type: Number, required: true },
    preferredCollectionDate: { type: Date, required: true },
    notes: { type: String, default: null },
    status: {
      type: String,
      enum: Object.values(BookingStatus),
      default: BookingStatus.PENDING,
    },
    isHighPriority: { type: Boolean, default: false },
    agentName: { type: String, default: null },
    vehicleId: { type: String, default: null },
  },
  { timestamps: true },
);

const BookingModel = model('Booking', bookingSchema);
const ActivityModel = model('BookingActivity', activitySchema);

// ── Seed data ──

const seeds = [
  {
    customerName: 'Priya Sharma',
    phoneNumber: '+91 98765 43210',
    email: 'priya.sharma@example.com',
    address: '42 Green Park, New Delhi, DL 110016',
    collectionType: CollectionType.HOUSEHOLD,
    estimatedPackageCount: 15,
    preferredCollectionDate: new Date('2024-03-20'),
    status: BookingStatus.PENDING,
    notes: 'Please call before arriving',
    agentName: null,
    vehicleId: null,
  },
  {
    customerName: 'Rahul Mehta Enterprises',
    phoneNumber: '+91 87654 32109',
    email: 'rahul.mehta@office.com',
    address: 'Tower B, Bandra Kurla Complex, Mumbai, MH 400051',
    collectionType: CollectionType.OFFICE,
    estimatedPackageCount: 150,
    preferredCollectionDate: new Date('2024-03-22'),
    status: BookingStatus.ASSIGNED,
    notes: 'Large volume — need a truck',
    agentName: 'Ravi Kumar',
    vehicleId: 'V001',
  },
  {
    customerName: 'Anjali Restaurant',
    phoneNumber: '+91 76543 21098',
    email: 'manager@anjalirestaurant.com',
    address: '78 Koregaon Park, Pune, MH 411001',
    collectionType: CollectionType.RESTAURANT_CAFE,
    estimatedPackageCount: 80,
    preferredCollectionDate: new Date('2024-03-18'),
    status: BookingStatus.COLLECTED,
    notes: null,
    agentName: 'Suresh Patil',
    vehicleId: 'V003',
  },
  {
    customerName: 'Sunrise Apartments RWA',
    phoneNumber: '+91 65432 10987',
    email: 'admin@sunriseapts.in',
    address: 'Sunrise Apartments, Whitefield, Bangalore, KA 560066',
    collectionType: CollectionType.APARTMENT,
    estimatedPackageCount: 200,
    preferredCollectionDate: new Date('2024-03-25'),
    status: BookingStatus.PENDING,
    notes: 'Coordinate with building security',
    agentName: null,
    vehicleId: null,
  },
  {
    customerName: 'FreshMart Retail',
    phoneNumber: '+91 54321 09876',
    email: 'ops@freshmart.in',
    address: 'Plot 15, Industrial Area Phase 2, Chandigarh, PB 160002',
    collectionType: CollectionType.RETAIL_STORE,
    estimatedPackageCount: 45,
    preferredCollectionDate: new Date('2024-03-21'),
    status: BookingStatus.CANCELLED,
    notes: null,
    agentName: null,
    vehicleId: null,
  },
  {
    customerName: 'Tech Park Office Complex',
    phoneNumber: '+91 99887 76655',
    email: 'facilities@techpark.co.in',
    address: 'Sector 62, Noida, UP 201309',
    collectionType: CollectionType.OFFICE,
    estimatedPackageCount: 320,
    preferredCollectionDate: new Date('2024-03-28'),
    status: BookingStatus.PENDING,
    notes: 'Multiple floors — need a team of 3',
    agentName: null,
    vehicleId: null,
  },
  {
    customerName: 'Green Valley Apartments',
    phoneNumber: '+91 88776 65544',
    email: 'secretary@greenvalley.coop',
    address: '12 Sarjapur Road, Bangalore, KA 560034',
    collectionType: CollectionType.APARTMENT,
    estimatedPackageCount: 95,
    preferredCollectionDate: new Date('2024-03-19'),
    status: BookingStatus.ASSIGNED,
    notes: null,
    agentName: 'Amit Verma',
    vehicleId: 'V002',
  },
  {
    customerName: 'The Coffee House',
    phoneNumber: '+91 77665 54433',
    email: 'owner@thecoffeehouse.in',
    address: '5 Connaught Place, New Delhi, DL 110001',
    collectionType: CollectionType.RESTAURANT_CAFE,
    estimatedPackageCount: 30,
    preferredCollectionDate: new Date('2024-03-23'),
    status: BookingStatus.PENDING,
    notes: null,
    agentName: null,
    vehicleId: null,
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set in .env');
    process.exit(1);
  }

  console.log('Connecting to MongoDB…');
  await mongoose.connect(url, { dbName: 'reverse_db' });
  console.log('Connected.\n');

  // Clear existing data
  await ActivityModel.deleteMany({});
  await BookingModel.deleteMany({});
  console.log('Cleared existing documents.\n');

  for (const data of seeds) {
    const isHighPriority = data.estimatedPackageCount > 100;
    const booking = await BookingModel.create({ ...data, isHighPriority });

    type Act = { event: string; description: string; metadata?: Record<string, unknown>; createdAt: Date };
    const activities: Act[] = [
      {
        event: 'BOOKING_CREATED',
        description: `Collection booking created for ${data.customerName}`,
        createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      },
    ];

    if (
      data.status === BookingStatus.ASSIGNED ||
      data.status === BookingStatus.COLLECTED
    ) {
      activities.push({
        event: 'ASSIGNED_TO_AGENT',
        description: `Assigned to ${data.agentName} (vehicle: ${data.vehicleId})`,
        metadata: { agentName: data.agentName!, vehicleId: data.vehicleId! },
        createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000),
      });
    }

    if (data.status === BookingStatus.COLLECTED) {
      activities.push({
        event: 'COLLECTION_COMPLETED',
        description: 'Collection completed successfully',
        createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000),
      });
    }

    if (data.status === BookingStatus.CANCELLED) {
      activities.push({
        event: 'BOOKING_CANCELLED',
        description: 'Booking was cancelled',
        createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000),
      });
    }

    await ActivityModel.insertMany(
      activities.map((a) => ({ ...a, bookingId: booking._id })),
    );

    console.log(
      `  ✓  ${data.customerName.padEnd(30)} ${data.status.padEnd(12)} priority=${isHighPriority}`,
    );
  }

  console.log('\nSeeding complete!');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
