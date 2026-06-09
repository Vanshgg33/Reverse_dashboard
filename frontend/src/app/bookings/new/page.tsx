import { BookingForm } from '@/components/bookings/BookingForm';
import { ArrowLeft, Package } from 'lucide-react';
import Link from 'next/link';

export default function NewBookingPage() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/" className="btn-ghost">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-px h-5 bg-slate-200" />
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center shrink-0">
            <Package className="w-4 h-4 text-brand-600" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900">New Collection Booking</h1>
            <p className="text-xs text-slate-400 font-medium">
              Schedule a packaging collection request
            </p>
          </div>
        </div>
      </div>

      <BookingForm />
    </div>
  );
}
