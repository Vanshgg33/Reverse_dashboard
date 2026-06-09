import type { BookingActivity } from '@/types';
import {
  PlusCircle,
  UserCheck,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Activity,
} from 'lucide-react';

const EVENT_CONFIG: Record<
  string,
  { icon: React.ElementType; iconBg: string; iconColor: string; label: string }
> = {
  BOOKING_CREATED: {
    icon: PlusCircle,
    iconBg: 'bg-brand-50',
    iconColor: 'text-brand-600',
    label: 'Booking Created',
  },
  ASSIGNED_TO_AGENT: {
    icon: UserCheck,
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    label: 'Assigned to Agent',
  },
  STATUS_UPDATED: {
    icon: RefreshCw,
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-600',
    label: 'Status Updated',
  },
  COLLECTION_COMPLETED: {
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    label: 'Collection Completed',
  },
  BOOKING_CANCELLED: {
    icon: XCircle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    label: 'Booking Cancelled',
  },
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days}d ago`;
  if (hrs > 0) return `${hrs}h ago`;
  if (mins > 0) return `${mins}m ago`;
  return 'Just now';
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ActivityTimeline({ activities }: { activities: BookingActivity[] }) {
  if (!activities.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Activity className="w-5 h-5 text-slate-300" />
        </div>
        <p className="text-xs text-slate-400 font-medium">No activity yet</p>
      </div>
    );
  }

  return (
    <ol className="relative">
      {activities.map((a, idx) => {
        const cfg = EVENT_CONFIG[a.event] ?? {
          icon: Activity,
          iconBg: 'bg-slate-50',
          iconColor: 'text-slate-500',
          label: a.event,
        };
        const Icon = cfg.icon;
        const isLast = idx === activities.length - 1;

        return (
          <li key={a.id} className="flex gap-3 group">
            {/* Icon + line */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.iconBg} ring-2 ring-white`}
              >
                <Icon className={`w-3.5 h-3.5 ${cfg.iconColor}`} />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-slate-100 my-1.5 min-h-[16px]" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-4 min-w-0 flex-1 ${isLast ? 'pb-0' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-slate-800 leading-snug">
                  {cfg.label}
                </p>
                <span
                  className="text-[10px] text-slate-400 whitespace-nowrap font-medium shrink-0"
                  title={formatDateTime(a.createdAt)}
                >
                  {timeAgo(a.createdAt)}
                </span>
              </div>
              {a.description && (
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {a.description}
                </p>
              )}
              <p className="text-[10px] text-slate-300 mt-1">
                {formatDateTime(a.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
