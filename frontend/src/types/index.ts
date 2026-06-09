export enum CollectionType {
  HOUSEHOLD = 'HOUSEHOLD',
  APARTMENT = 'APARTMENT',
  OFFICE = 'OFFICE',
  RETAIL_STORE = 'RETAIL_STORE',
  RESTAURANT_CAFE = 'RESTAURANT_CAFE',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  COLLECTED = 'COLLECTED',
  CANCELLED = 'CANCELLED',
}

export interface BookingActivity {
  id: string;
  bookingId: string;
  event: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string;
  address: string;
  collectionType: CollectionType;
  estimatedPackageCount: number;
  preferredCollectionDate: string;
  notes: string | null;
  status: BookingStatus;
  isHighPriority: boolean;
  agentName: string | null;
  vehicleId: string | null;
  activities: BookingActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalBookings: number;
  pending: number;
  assigned: number;
  collected: number;
  cancelled: number;
  highPriority: number;
  averagePackagesPerBooking: number;
  totalPackages: number;
  recentBookings: {
    id: string;
    customerName: string;
    collectionType: CollectionType;
    status: BookingStatus;
    isHighPriority: boolean;
    estimatedPackageCount: number;
    createdAt: string;
  }[];
  collectionTypeBreakdown: { type: CollectionType; count: number }[];
}

export const COLLECTION_TYPE_LABELS: Record<CollectionType, string> = {
  [CollectionType.HOUSEHOLD]: 'Household',
  [CollectionType.APARTMENT]: 'Apartment',
  [CollectionType.OFFICE]: 'Office',
  [CollectionType.RETAIL_STORE]: 'Retail Store',
  [CollectionType.RESTAURANT_CAFE]: 'Restaurant / Cafe',
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'Pending',
  [BookingStatus.ASSIGNED]: 'Assigned',
  [BookingStatus.COLLECTED]: 'Collected',
  [BookingStatus.CANCELLED]: 'Cancelled',
};

export interface CreateBookingPayload {
  customerName: string;
  phoneNumber: string;
  email: string;
  address: string;
  collectionType: CollectionType;
  estimatedPackageCount: number;
  preferredCollectionDate: string;
  notes?: string;
}
