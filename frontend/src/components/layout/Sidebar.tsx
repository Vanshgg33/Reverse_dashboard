'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Recycle, Circle } from 'lucide-react';

const nav = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/bookings/new', icon: PlusCircle, label: 'New Booking' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 flex flex-col shrink-0 h-full border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-700 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-900/40">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm tracking-[0.15em]">REVERSE</p>
            <p className="text-[11px] text-slate-500 font-medium">Operations Hub</p>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/5" />

      {/* Nav */}
      <nav className="flex-1 p-3 mt-2 space-y-0.5">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-3 mb-3">
          Menu
        </p>
        {nav.map(({ href, icon: Icon, label }) => {
          const active =
            href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-brand-500/15 text-brand-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${active ? 'text-brand-400' : 'text-slate-500'}`}
              />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 mx-2 mb-3 rounded-xl bg-white/[0.03] border border-white/5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500" />
          </span>
          <p className="text-xs text-slate-500 font-medium">System Operational</p>
        </div>
        <p className="text-[11px] text-slate-700 mt-1">REVERSE v1.0 · 2025</p>
      </div>
    </aside>
  );
}
