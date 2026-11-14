'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CourseWithStats } from '@/lib/types';
import { CourseCard } from '@/components/course/CourseCard';
import { CommunityStatsBar } from '@/components/course/CommunityStatsBar';
import { Search } from 'lucide-react';

function CoursesContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || 'Tất cả';
  const initialSearch = searchParams.get('search') || '';

  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCats() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) setCategories(await res.json());
      } catch (e) {
        // ignore
      }
    }
    fetchCats();
  }, []);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/courses?category=${encodeURIComponent(selectedCategory)}&search=${encodeURIComponent(search)}`
        );
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(fetchCourses, 150);
    return () => clearTimeout(timer);
  }, [selectedCategory, search]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
            Danh Sách Khóa Học
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Các khóa học tinh gọn theo lộ trình thực tế
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm tên khóa học..."
            className="w-full h-8 bg-white border border-slate-200 rounded-lg pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Thống kê & Nhóm cộng đồng */}
      <CommunityStatsBar />

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(categories.length > 0
          ? categories
          : [
              { name: 'Tất cả', count: courses.length },
              { name: 'Lập trình', count: 0 },
              { name: 'Ngoại ngữ', count: 0 },
              { name: 'Thiết kế', count: 0 },
            ]
        ).map((c) => {
          const cat = c.name;
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Đang tải danh sách khóa học...
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 bg-white rounded-xl p-6">
          <p className="text-sm text-slate-800 font-medium">Không tìm thấy khóa học phù hợp</p>
          <p className="text-xs text-slate-400 mt-1">Vui lòng thử tìm kiếm với từ khóa khác.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Đang tải danh sách khóa học...</div>}>
      <CoursesContent />
    </Suspense>
  );
}
