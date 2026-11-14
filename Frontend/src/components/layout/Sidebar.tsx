'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Code2,
  Languages,
  Palette,
  LayoutGrid,
  Sliders,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const DEFAULT_CATEGORIES = ['Lập trình', 'Ngoại ngữ', 'Thiết kế'];

function getCategoryIcon(label: string) {
  const normalized = label.trim().toLowerCase();
  if (normalized === 'lập trình') return Code2;
  if (normalized === 'ngoại ngữ') return Languages;
  if (normalized === 'thiết kế') return Palette;
  return BookOpen;
}

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [categoryNames, setCategoryNames] = useState<string[]>(DEFAULT_CATEGORIES);

  const loadCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const names = data
            .map((item: any) => (typeof item?.name === 'string' ? item.name.trim() : ''))
            .filter((name: string) => name && name !== 'Tất cả');
          setCategoryNames(Array.from(new Set([...DEFAULT_CATEGORIES, ...names])));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setCurrentCategory(params.get('category'));
    }
    loadCategories();
  }, [pathname, loadCategories]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleCategoriesUpdated = () => {
      loadCategories();
    };
    window.addEventListener('categories-updated', handleCategoriesUpdated);
    return () => {
      window.removeEventListener('categories-updated', handleCategoriesUpdated);
    };
  }, [loadCategories]);

  const categories = [
    {
      label: 'Tất cả khóa học',
      href: '/courses',
      icon: LayoutGrid,
      active: pathname === '/courses' && !currentCategory,
    },
    ...categoryNames.map((name) => ({
      label: name,
      href: `/courses?category=${encodeURIComponent(name)}`,
      icon: getCategoryIcon(name),
      active: currentCategory === name,
    })),
  ];

  return (
    <aside className="w-56 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 select-none sticky top-16 h-[calc(100vh-64px)] z-30 p-3 justify-between shadow-xs overflow-y-auto">
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
                  <Icon className={`w-4 h-4 shrink-0 ${cat.active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="truncate">{cat.label}</span>
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
