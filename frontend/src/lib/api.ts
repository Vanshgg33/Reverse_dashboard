import type {
  Booking,
  CreateBookingPayload,
  DashboardStats,
  PaginatedResponse,
} from '@/types';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(res.status, body.message ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export type BookingListParams = {
  status?: string;
  collectionType?: string;
  search?: string;
  isHighPriority?: boolean;
  page?: number;
  limit?: number;
};

export const api = {
  bookings: {
    create: async (payload: CreateBookingPayload) =>
      await request<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),

    list: async (params: BookingListParams = {}) => {
      const qs = new URLSearchParams();
      (Object.entries(params) as [string, unknown][]).forEach(([k, v]) => {
        if (v !== undefined && v !== '') qs.set(k, String(v));
      });
      const query = qs.toString();
      return await request<PaginatedResponse<Booking>>(
        `/bookings${query ? `?${query}` : ''}`,
      );
    },

    get: async (id: string) => await request<Booking>(`/bookings/${id}`),

    updateStatus: async (id: string, status: string) =>
      await request<Booking>(`/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),

    assign: async (id: string, data: { agentName: string; vehicleId: string }) =>
      await request<Booking>(`/bookings/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  dashboard: {
    get: async () => await request<DashboardStats>('/dashboard'),
  },
};
