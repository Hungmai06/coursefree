'use client';

import React from 'react';
import Link from 'next/link';
import { Play, BookOpen } from 'lucide-react';
import { CourseWithStats } from '@/lib/types';
import { Button } from '../ui/Button';

interface CourseCardProps {
  course: CourseWithStats;
  viewMode?: 'grid' | 'list';
}

export function CourseCard({ course }: CourseCardProps) {
  const targetUrl = course.firstLessonId
    ? `/watch/${course.id}/${course.firstLessonId}`
    : `/courses/${course.id}`;

  return (
    <div className="bg-white hover:bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md rounded-xl p-5 transition-all duration-200 group flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Top: Category Badge & Lesson Count */}
        <div className="flex items-center justify-between text-xs">
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-wide uppercase bg-blue-50 text-blue-700 border border-blue-200 font-mono">
            {course.category}
          </span>
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
            {course.totalChapters} chương • {course.totalLessons} bài
          </span>
        </div>

        {/* Title */}
        <Link href={`/courses/${course.id}`} className="block">
          <h3 className="font-semibold text-base text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
            {course.title}
          </h3>
        </Link>
      </div>

      {/* Bottom Actions */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <Link href={`/courses/${course.id}`}>
          <span className="text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium">
            Chi tiết lộ trình
          </span>
        </Link>

        <Link href={targetUrl}>
          <Button variant="primary" size="sm" className="h-8 px-3 text-xs gap-1.5 font-semibold">
            <Play className="w-3 h-3 fill-current" />
            Vào học ngay
          </Button>
        </Link>
      </div>
    </div>
  );
}
