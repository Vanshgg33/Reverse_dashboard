'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api, type BookingListParams } from '@/lib/api';
import { StatusBadge } from './StatusBadge';
import {
  BookingStatus,
  CollectionType,
  COLLECTION_TYPE_LABELS,
  type Booking,
} from '@/types';
import {
  Search,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
  ArrowRight,
} from 'lucide-react';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function shortId(id: string) {
  return `#${id.slice(-6).toUpperCase()}`;
}

function Initials({ name }: { name: string }) {
  const i = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
      <span className="text-[10px] font-bold text-slate-600">{i}</span>
    </div>
  );
}

export function BookingsTable() {
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<CollectionType | ''>('');
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [page, setPage] = useState(1);

  const params: BookingListParams = {
    page,
    limit: 10,
    ...(search && { search }),
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { collectionType: typeFilter }),
    ...(priorityOnly && { isHighPriority: true }),
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['bookings', params],
    queryFn: async () => await api.bookings.list(params),
    placeholderData: (prev) => prev,
  });

  const bookings = data?.data ?? [];
  const meta = data?.meta;
  const hasFilters = !!(search || statusFilter || typeFilter || priorityOnly);

  function handleReset() {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setPriorityOnly(false);
    setPage(1);
  }

  const HEADERS = ['Booking', 'Customer', 'Type', 'Packages', 'Collection Date', 'Status', ''];

  return (
    <div className="card overflow-hidden">
      {/* Filter bar */}
      <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search customer, email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="form-input pl-8 py-2 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as BookingStatus | ''); setPage(1); }}
              className="form-input py-2 text-xs w-32"
            >
              <option value="">All Status</option>
              {Object.values(BookingStatus).map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </option>
              ))}
            </select>

            {/* Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as CollectionType | ''); setPage(1); }}
              className="form-input py-2 text-xs w-36"
            >
              <option value="">All Types</option>
              {Object.values(CollectionType).map((t) => (
                <option key={t} value={t}>
                  {COLLECTION_TYPE_LABELS[t]}
                </option>
              ))}
            </select>

            {/* Priority toggle */}
            <button
              onClick={() => { setPriorityOnly((v) => !v); setPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 ${
                priorityOnly
                  ? 'bg-red-50 border-red-200 text-red-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Priority
            </button>

            {hasFilters && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {meta && (
            <span className="ml-auto text-xs text-slate-400 font-medium">
              {meta.total} booking{meta.total !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-50">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="h-3.5 bg-slate-100 animate-pulse rounded-lg w-24" />
                    </td>
                  ))}
                </tr>
              ))}

            {isError && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-sm font-semibold text-red-600">Failed to load bookings</p>
                    <p className="text-xs text-slate-400">Make sure the backend is running on port 3001</p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading && !isError && bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-600">No bookings found</p>
                    <p className="text-xs text-slate-400">
                      {hasFilters ? 'Try adjusting your filters' : 'Create your first booking to get started'}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {bookings.map((b: Booking, idx: number) => (
              <tr
                key={b.id}
                onClick={() => router.push(`/bookings/${b.id}`)}
                className={`cursor-pointer hover:bg-brand-50/40 transition-colors group border-b ${
                  idx === bookings.length - 1 ? 'border-transparent' : 'border-slate-50'
                }`}
              >
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-slate-400">
                      {shortId(b.id)}
                    </span>
                    {b.isHighPriority && b.status !== BookingStatus.COLLECTED && b.status !== BookingStatus.CANCELLED && (
                      <span title="High Priority">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <Initials name={b.customerName} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate max-w-[150px]">
                        {b.customerName}
                      </p>
                      <p className="text-xs text-slate-400 truncate max-w-[150px]">
                        {b.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {COLLECTION_TYPE_LABELS[b.collectionType]}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm font-semibold text-slate-800 tabular-nums">
                    {b.estimatedPackageCount.toLocaleString()}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="text-sm text-slate-600 whitespace-nowrap">
                    {formatDate(b.preferredCollectionDate)}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={b.status} />
                </td>
                <td className="px-4 py-3.5">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/30">
          <p className="text-xs text-slate-400">
            Showing{' '}
            <span className="font-semibold text-slate-600">
              {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)}
            </span>{' '}
            of <span className="font-semibold text-slate-600">{meta.total}</span>
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-slate-600" />
            </button>

            {(() => {
              const delta = 2;
              const left = Math.max(1, page - delta);
              const right = Math.min(meta.totalPages, page + delta);
              return Array.from({ length: right - left + 1 }, (_, i) => {
                const p = left + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                      p === page
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              });
            })()}

            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page === meta.totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
