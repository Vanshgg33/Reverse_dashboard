import { BookingsTable } from '@/components/dashboard/BookingsTable';

export default function BookingsPage() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">All Bookings</h1>
        <p className="text-sm text-slate-400 mt-0.5 font-medium">
          Search, filter, and manage collection requests
        </p>
      </div>
      <BookingsTable />
    </div>
  );
}
