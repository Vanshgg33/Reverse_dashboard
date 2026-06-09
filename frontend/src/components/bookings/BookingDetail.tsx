'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  BookingStatus,
  COLLECTION_TYPE_LABELS,
  STATUS_LABELS,
  type Booking,
} from '@/types';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { ActivityTimeline } from './ActivityTimeline';
import { AssignModal } from './AssignModal';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  AlertTriangle,
  User,
  Phone,
  Mail,
  MapPin,
  Package,
  Calendar,
  Truck,
  StickyNote,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
} from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

const STATUS_BANNER: Record<
  BookingStatus,
  { bg: string; text: string; icon: React.ElementType }
> = {
  [BookingStatus.PENDING]: {
    bg: 'from-amber-50 to-amber-50/0',
    text: 'text-amber-700',
    icon: Clock,
  },
  [BookingStatus.ASSIGNED]: {
    bg: 'from-indigo-50 to-indigo-50/0',
    text: 'text-indigo-700',
    icon: Truck,
  },
  [BookingStatus.COLLECTED]: {
    bg: 'from-emerald-50 to-emerald-50/0',
    text: 'text-emerald-700',
    icon: CheckCircle,
  },
  [BookingStatus.CANCELLED]: {
    bg: 'from-slate-100 to-slate-50/0',
    text: 'text-slate-500',
    icon: XCircle,
  },
};

const NEXT_STATUSES: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CANCELLED],
  [BookingStatus.ASSIGNED]: [BookingStatus.COLLECTED, BookingStatus.CANCELLED],
  [BookingStatus.COLLECTED]: [],
  [BookingStatus.CANCELLED]: [],
};

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className={`text-sm text-slate-800 mt-0.5 ${mono ? 'font-mono' : 'font-medium'}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <div className="w-7 h-7 bg-slate-100 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 bg-slate-100 rounded w-16" />
              <div className="h-3.5 bg-slate-100 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookingDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAssign, setShowAssign] = useState(false);

  const { data: booking, isLoading, isError } = useQuery<Booking>({
    queryKey: ['booking', id],
    queryFn: async () => await api.bookings.get(id),
  });

  const statusMutation = useMutation({
    mutationFn: async (status: BookingStatus) => await api.bookings.updateStatus(id, status),
    onSuccess: (updated) => {
      queryClient.setQueryData(['booking', id], updated);
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success(`Status updated to ${STATUS_LABELS[updated.status]}`);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto space-y-4">
        <div className="h-10 w-24 bg-slate-100 rounded-xl animate-pulse" />
        <div className="card p-5 animate-pulse h-24" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <button onClick={() => router.push('/')} className="btn-secondary mb-6">
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="card p-16 text-center">
          <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Booking not found</p>
          <p className="text-xs text-slate-400 mt-1">
            This booking may have been deleted or the ID is invalid.
          </p>
        </div>
      </div>
    );
  }

  const banner = STATUS_BANNER[booking.status];
  const nextStatuses = NEXT_STATUSES[booking.status];
  const canAssign =
    booking.status === BookingStatus.PENDING ||
    booking.status === BookingStatus.ASSIGNED;
  const isTerminal =
    booking.status === BookingStatus.COLLECTED ||
    booking.status === BookingStatus.CANCELLED;

  return (
    <>
      <div className="p-6 max-w-[1200px] mx-auto space-y-5">
        {/* Back button + page header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="btn-ghost">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-slate-200" />
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              Booking Detail
            </p>
            <p className="text-sm font-black text-slate-900">
              {shortId(booking.id)}
            </p>
          </div>
        </div>

        {/* Status banner */}
        <div
          className={`card overflow-hidden bg-gradient-to-r ${banner.bg} px-5 py-4`}
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <StatusBadge status={booking.status} />
                {booking.isHighPriority && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 ring-1 ring-red-200/60">
                    <AlertTriangle className="w-3 h-3" />
                    High Priority
                  </span>
                )}
              </div>
              <div className="w-px h-5 bg-slate-200 hidden sm:block" />
              <div>
                <p className="text-lg font-black text-slate-900">
                  {booking.customerName}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Created {formatShortDate(booking.createdAt)} ·{' '}
                  {COLLECTION_TYPE_LABELS[booking.collectionType]}
                </p>
              </div>
            </div>

            {/* Actions */}
            {!isTerminal && (
              <div className="flex items-center gap-2 flex-wrap">
                {canAssign && (
                  <button onClick={() => setShowAssign(true)} className="btn-primary">
                    <Truck className="w-4 h-4" />
                    {booking.agentName ? 'Re-assign' : 'Assign Agent'}
                  </button>
                )}
                {nextStatuses
                  .filter((s) => s !== BookingStatus.ASSIGNED)
                  .map((s) => (
                    <button
                      key={s}
                      onClick={() => statusMutation.mutate(s)}
                      disabled={statusMutation.isPending}
                      className={
                        s === BookingStatus.CANCELLED ? 'btn-danger' : 'btn-secondary'
                      }
                    >
                      {statusMutation.isPending ? (
                        <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                      ) : s === BookingStatus.CANCELLED ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Mark {STATUS_LABELS[s]}
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Customer info */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-slate-400" />
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Customer
                </h2>
              </div>
              <InfoRow icon={User} label="Name" value={booking.customerName} />
              <InfoRow icon={Phone} label="Phone" value={booking.phoneNumber} mono />
              <InfoRow icon={Mail} label="Email" value={booking.email} />
              <InfoRow icon={MapPin} label="Address" value={booking.address} />
            </div>

            {/* Collection details */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-slate-400" />
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Collection
                </h2>
              </div>
              <InfoRow
                icon={Package}
                label="Type"
                value={COLLECTION_TYPE_LABELS[booking.collectionType]}
              />
              <InfoRow
                icon={Package}
                label="Estimated Packages"
                value={`${booking.estimatedPackageCount.toLocaleString()} packages`}
              />
              <InfoRow
                icon={Calendar}
                label="Preferred Date"
                value={formatDate(booking.preferredCollectionDate)}
              />
              {booking.agentName && (
                <InfoRow
                  icon={Truck}
                  label="Assigned Agent"
                  value={booking.vehicleId ? `${booking.agentName}  ·  Vehicle ${booking.vehicleId}` : booking.agentName}
                />
              )}
              {booking.notes && (
                <InfoRow icon={StickyNote} label="Notes" value={booking.notes} />
              )}
            </div>

            {/* Timestamps */}
            <div className="card px-5 py-4">
              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Created: <span className="text-slate-600 font-semibold">{formatShortDate(booking.createdAt)}</span></span>
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated: <span className="text-slate-600 font-semibold">{formatShortDate(booking.updatedAt)}</span></span>
                </div>
                <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block" />
                <span className="font-mono text-slate-300 text-[10px]">{booking.id}</span>
              </div>
            </div>
          </div>

          {/* Right: activity */}
          <div className="card p-5 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-400" />
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Activity
              </h2>
              <span className="ml-auto bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {booking.activities?.length ?? 0}
              </span>
            </div>
            <ActivityTimeline activities={booking.activities ?? []} />
          </div>
        </div>
      </div>

      {showAssign && (
        <AssignModal bookingId={booking.id} onClose={() => setShowAssign(false)} />
      )}
    </>
  );
}
