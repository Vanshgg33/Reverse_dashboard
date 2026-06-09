'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MetricsCard } from './MetricsCard';
import { BookingsTable } from './BookingsTable';
import { StatusBadge } from './StatusBadge';
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  AlertTriangle,
  PlusCircle,
  TrendingUp,
} from 'lucide-react';
import type { DashboardStats } from '@/types';
import { BookingStatus, COLLECTION_TYPE_LABELS } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  HOUSEHOLD:       'bg-blue-500',
  APARTMENT:       'bg-violet-500',
  OFFICE:          'bg-amber-500',
  RETAIL_STORE:    'bg-emerald-500',
  RESTAURANT_CAFE: 'bg-rose-500',
};

function TypeBar({
  label,
  count,
  total,
  type,
}: {
  label: string;
  count: number;
  total: number;
  type: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const bar = TYPE_COLORS[type] ?? 'bg-brand-500';
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="text-slate-400 tabular-nums">
          {count} <span className="text-slate-300">·</span> {pct}%
        </span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${bar} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => await api.dashboard.get(),
    refetchInterval: 30_000,
  });

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Operations Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 font-medium">{today}</p>
        </div>
        <Link href="/bookings/new" className="btn-primary shrink-0">
          <PlusCircle className="w-4 h-4" />
          New Booking
        </Link>
      </div>

      {/* High-priority alert */}
      {(stats?.highPriority ?? 0) > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200/60 rounded-2xl px-4 py-3">
          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700">
              {stats?.highPriority} high-priority booking
              {stats?.highPriority !== 1 ? 's' : ''} require immediate attention
            </p>
            <p className="text-xs text-red-400 mt-0.5">
              Bookings with more than 100 packages are flagged as high priority.
            </p>
          </div>
        </div>
      )}

      {/* Primary KPIs */}
      <div>
        <p className="section-title">Overview</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricsCard
            title="Total Bookings"
            value={stats?.totalBookings ?? 0}
            icon={Package}
            color="blue"
            isLoading={isLoading}
          />
          <MetricsCard
            title="Pending"
            value={stats?.pending ?? 0}
            icon={Clock}
            color="yellow"
            isLoading={isLoading}
          />
          <MetricsCard
            title="Assigned"
            value={stats?.assigned ?? 0}
            icon={Truck}
            color="indigo"
            isLoading={isLoading}
          />
          <MetricsCard
            title="Collected"
            value={stats?.collected ?? 0}
            icon={CheckCircle}
            color="green"
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Mid section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Collection type breakdown + mini-stats */}
        <div className="card p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-brand-500" />
            <h3 className="text-sm font-bold text-slate-700">By Collection Type</h3>
          </div>

          {isLoading ? (
            <div className="space-y-3 flex-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 bg-slate-100 animate-pulse rounded w-3/4" />
                  <div className="h-2 bg-slate-100 animate-pulse rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3.5 flex-1">
              {(stats?.collectionTypeBreakdown ?? []).map(({ type, count }) => (
                <TypeBar
                  key={type}
                  type={type}
                  label={COLLECTION_TYPE_LABELS[type as keyof typeof COLLECTION_TYPE_LABELS]}
                  count={count}
                  total={stats?.totalBookings ?? 0}
                />
              ))}
              {(stats?.collectionTypeBreakdown ?? []).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No data yet</p>
              )}
            </div>
          )}

          {/* Mini stats */}
          <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-black text-red-500 tabular-nums leading-none">
                {isLoading ? '—' : (stats?.highPriority ?? 0)}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                Priority
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-slate-500 tabular-nums leading-none">
                {isLoading ? '—' : (stats?.cancelled ?? 0)}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                Cancelled
              </p>
            </div>
            <div>
              <p className="text-lg font-black text-teal-600 tabular-nums leading-none">
                {isLoading ? '—' : (stats?.averagePackagesPerBooking ?? 0).toFixed(1)}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                Avg Pkgs
              </p>
            </div>
          </div>
        </div>

        {/* Recent bookings */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-700">Recent Bookings</h3>
          </div>

          {isLoading ? (
            <div className="space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="w-9 h-9 bg-slate-100 animate-pulse rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-slate-100 animate-pulse rounded w-1/2" />
                    <div className="h-2.5 bg-slate-100 animate-pulse rounded w-1/3" />
                  </div>
                  <div className="h-5 w-16 bg-slate-100 animate-pulse rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-slate-50">
              {(stats?.recentBookings ?? []).map((b) => {
                const initials = b.customerName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <li key={b.id}>
                    <Link
                      href={`/bookings/${b.id}`}
                      className="py-3 flex items-center gap-3 group -mx-5 px-5 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-sm">
                        <span className="text-[10px] font-bold text-white">{initials}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                          {b.customerName}
                        </p>
                        <p className="text-xs text-slate-400">
                          {COLLECTION_TYPE_LABELS[b.collectionType as keyof typeof COLLECTION_TYPE_LABELS]} ·{' '}
                          {b.estimatedPackageCount} pkgs
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {b.isHighPriority && b.status !== BookingStatus.COLLECTED && b.status !== BookingStatus.CANCELLED && (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                        )}
                        <StatusBadge status={b.status} />
                      </div>
                    </Link>
                  </li>
                );
              })}
              {(stats?.recentBookings ?? []).length === 0 && (
                <li className="py-10 text-center text-xs text-slate-400 font-medium">
                  No bookings yet. Create one to get started.
                </li>
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Full bookings table */}
      <div>
        <p className="section-title">All Bookings</p>
        <BookingsTable />
      </div>
    </div>
  );
}
