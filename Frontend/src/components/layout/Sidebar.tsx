'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Code2,
  Languages,
  Palette,
  LayoutGrid,
  Sliders,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setCurrentCategory(params.get('category'));
    }
  }, [pathname]);

  const categories = [
    { label: 'Tất cả khóa học', href: '/courses', icon: LayoutGrid, active: pathname === '/courses' && !currentCategory },
    { label: 'Lập trình', href: '/courses?category=Lập trình', icon: Code2, active: currentCategory === 'Lập trình' },
    { label: 'Ngoại ngữ', href: '/courses?category=Ngoại ngữ', icon: Languages, active: currentCategory === 'Ngoại ngữ' },
    { label: 'Thiết kế', href: '/courses?category=Thiết kế', icon: Palette, active: currentCategory === 'Thiết kế' },
  ];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 select-none sticky top-16 h-[calc(100vh-64px)] z-30 p-3 justify-between shadow-xs">
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-mono tracking-wider text-slate-400 px-2.5 uppercase font-semibold block mb-1">
            DANH MỤC KHÓA HỌC
          </span>
          <div className="space-y-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setCurrentCategory(cat.label === 'Tất cả khóa học' ? null : cat.label)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    cat.active
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${cat.active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{cat.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {isAdmin && (
          <div className="pt-2 border-t border-slate-200">
            <span className="text-[10px] font-mono tracking-wider text-blue-600 px-2.5 uppercase font-bold block mb-1">
              QUẢN TRỊ VIÊN
            </span>
            <Link
              href="/admin"
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sliders className="w-4 h-4 text-blue-600" />
              <span>Quản trị Khóa học</span>
            </Link>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-slate-100 text-[11px] text-slate-400 font-mono">
        CourseFree • Light Clean
      </div>
    </aside>
  );
}
