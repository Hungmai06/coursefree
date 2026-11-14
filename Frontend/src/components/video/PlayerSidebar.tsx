'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, CheckCircle2, ChevronLeft, Bookmark, FileText } from 'lucide-react';
import { HierarchyNode } from '@/lib/types';
import { ProgressBar } from '../ui/Badge';
import { CurriculumTree } from '../course/CurriculumTree';

interface PlayerSidebarProps {
  courseId: string;
  courseTitle: string;
  nodes: HierarchyNode[];
  activeLessonId: string;
  completedCount: number;
  totalLessons: number;
  progressPercentage: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function PlayerSidebar({
  courseId,
  courseTitle,
  nodes,
  activeLessonId,
  completedCount,
  totalLessons,
  progressPercentage,
  isOpenMobile,
  onCloseMobile,
}: PlayerSidebarProps) {
  const router = useRouter();

  const handleSelectLesson = (lessonId: string) => {
    router.push(`/watch/${courseId}/${lessonId}`);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 right-0 bottom-0 z-50 lg:z-10 w-80 bg-background-sidebar border-l border-border flex flex-col h-screen transition-transform duration-200 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border bg-[#0E0E11] shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase text-foreground-muted tracking-wider">
              Course Curriculum
            </span>
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-foreground-muted hover:text-foreground text-xs"
            >
              Close
            </button>
          </div>

          <Link
            href={`/courses/${courseId}`}
            className="text-xs font-semibold text-foreground hover:text-accent transition-colors line-clamp-1 block mb-3"
            title={courseTitle}
          >
            {courseTitle}
          </Link>

          <div>
            <div className="flex items-center justify-between text-[11px] font-mono text-foreground-muted mb-1.5">
              <span>{completedCount} of {totalLessons} completed</span>
              <span className="text-accent">{progressPercentage}%</span>
            </div>
            <ProgressBar value={progressPercentage} />
          </div>
        </div>

        {/* Tree Content with dedicated independent scrolling */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <CurriculumTree
            nodes={nodes}
            courseId={courseId}
            activeLessonId={activeLessonId}
            onSelectLesson={handleSelectLesson}
            compact
          />
        </div>
      </aside>
    </>
  );
}

