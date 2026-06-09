import type { LucideIcon } from 'lucide-react';

type Color = 'blue' | 'yellow' | 'purple' | 'green' | 'red' | 'gray' | 'teal' | 'indigo';

const colorMap: Record<Color, string> = {
  blue:   'bg-blue-500',
  yellow: 'bg-amber-400',
  purple: 'bg-purple-500',
  indigo: 'bg-indigo-500',
  green:  'bg-emerald-500',
  red:    'bg-red-500',
  gray:   'bg-slate-400',
  teal:   'bg-teal-500',
};

interface Props {
  title: string;
  value: number;
  icon: LucideIcon;
  color: Color;
  isLoading?: boolean;
  suffix?: string;
}

export function MetricsCard({ title, value, icon: Icon, color, isLoading, suffix }: Props) {
  const iconBg = colorMap[color];

  return (
    <div className="card p-5 hover:shadow-md hover:shadow-slate-200/60 hover:-translate-y-px transition-all duration-200">
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center mb-4 shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-lg" />
          <div className="h-2.5 w-16 bg-slate-100 animate-pulse rounded" />
        </div>
      ) : (
        <>
          <p className="text-[2.25rem] font-black text-slate-900 leading-none tabular-nums">
            {value.toLocaleString()}
            {suffix && (
              <span className="text-base font-semibold text-slate-400 ml-1.5">{suffix}</span>
            )}
          </p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1.5">
            {title}
          </p>
        </>
      )}
    </div>
  );
}
