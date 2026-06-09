import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingsModule } from './bookings/bookings.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL as string, {
      dbName: 'reverse_db',
    }),
    BookingsModule,
    DashboardModule,
  ],
})
export class AppModule {}
