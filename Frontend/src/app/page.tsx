'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Code2, Languages, Palette, LayoutGrid, Clock, ArrowRight, Sparkles, BookOpen } from 'lucide-react';
import { CourseCard } from '@/components/course/CourseCard';
import { CommunityStatsBar } from '@/components/course/CommunityStatsBar';
import { CourseWithStats } from '@/lib/types';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseWithStats[]>([]);
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Tất cả');
  const [loading, setLoading] = useState(true);
  const [lastLearningItem, setLastLearningItem] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [cRes, catRes] = await Promise.all([
          fetch(`/api/courses?category=${encodeURIComponent(activeCategory)}`),
          fetch('/api/categories'),
        ]);

        if (cRes.ok) setCourses(await cRes.json());
        if (catRes.ok) setCategories(await catRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [activeCategory]);

  // Tải nhật ký học tập gần nhất của user đã đăng nhập
  useEffect(() => {
    async function loadUserHistory() {
      if (!user?.id) {
        setLastLearningItem(null);
        return;
      }
      try {
        const res = await fetch(`/api/user/history?userId=${encodeURIComponent(user.id)}`);
        if (res.ok) {
          const data = await res.json();
          setLastLearningItem(data.lastLesson || null);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadUserHistory();
  }, [user?.id]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Thống kê học viên & Nhóm cộng đồng */}
      <CommunityStatsBar />

      {/* Banner Tiếp Tục Học Tập / Nhật Ký Học Của Bạn */}
      {lastLearningItem && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono uppercase bg-blue-600 text-white px-2 py-0.5 rounded font-bold tracking-wide">
                  NHẬT KÝ HỌC GẦN NHẤT
                </span>
                <span className="text-xs text-blue-700 font-medium truncate">
                  {lastLearningItem.courseTitle}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {lastLearningItem.lessonTitle}
              </h2>
            </div>
          </div>

          <Link href={`/watch/${lastLearningItem.courseId}/${lastLearningItem.lessonId}`}>
            <button className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all hover:scale-105 shrink-0 cursor-pointer">
              <span>Tiếp tục học ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      )}

      {/* Category Tabs: LẬP TRÌNH, NGOẠI NGỮ, THIẾT KẾ */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900">
              Thư Viện Khóa Học
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tập trung vào chất lượng nội dung: Lập trình, Ngoại ngữ và Thiết kế
            </p>
          </div>

          <span className="text-xs font-mono text-slate-400">
            {courses.length} Khóa học khả dụng
          </span>
        </div>

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
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
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
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">
          Đang tải danh sách khóa học...
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 bg-white rounded-xl p-6">
          <p className="text-sm text-slate-800 font-medium">Chưa có khóa học nào trong danh mục này</p>
          <p className="text-xs text-slate-400 mt-1">Vui lòng chọn danh mục khác hoặc tạo khóa học mới từ trang Admin.</p>
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
