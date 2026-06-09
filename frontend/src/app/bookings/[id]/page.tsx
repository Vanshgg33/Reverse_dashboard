import { BookingDetail } from '@/components/bookings/BookingDetail';

export default function BookingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <BookingDetail id={params.id} />;
}
