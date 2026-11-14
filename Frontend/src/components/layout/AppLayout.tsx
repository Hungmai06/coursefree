'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isWatchPage = pathname.startsWith('/watch/');

  if (isWatchPage) {
    return <main className="min-h-screen bg-slate-50 text-slate-900">{children}</main>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900">
      <Header />
      <div className="flex-1 flex">
        <Suspense fallback={<div className="w-56 bg-white border-r border-slate-200" />}>
          <Sidebar />
        </Suspense>
        <main className="flex-1 min-w-0 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
