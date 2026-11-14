'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Play,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Sliders,
  CheckCircle2,
  Check,
  PlayCircle,
  Lock,
  ExternalLink,
  BookOpen,
  Folder,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';

function isVideoLink(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) return true;
  if ((lower.includes('drive.google.com') || lower.includes('docs.google.com')) && lower.includes('/file/d/')) return true;
  const exts = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.m3u8'];
  return exts.some((ext) => lower.includes(ext));
}

// Phân biệt chính xác giữa Folder thật sự vs File (.mp4, .zip, v.v.)
function isNodeFolder(node: any): boolean {
  if (node.children && Array.isArray(node.children) && node.children.length > 0) {
    return true;
  }
  const title = (node.title || '').trim().toLowerCase();
  const isVideoFile = /\.(mp4|mkv|webm|avi|mov|flv|wmv|m4v)$/i.test(title);
  const isDocFile = /\.(zip|rar|7z|tar|gz|pdf|docx|xlsx|doc|txt)$/i.test(title);
  if (isVideoFile || isDocFile) {
    return false;
  }
  if (node.type === 'lesson') {
    return false;
  }
  if (node.url && node.url.trim().length > 0) {
    return false;
  }
  return node.type === 'chapter' || node.type === 'folder';
}

function countLessonsRecursive(node: any): number {
  if (!isNodeFolder(node)) return 1;
  if (!node.children || !Array.isArray(node.children)) return 0;
  let count = 0;
  for (const child of node.children) {
    count += countLessonsRecursive(child);
  }
  return count;
}

// Trích xuất danh sách bài học theo thứ tự thực tế trong cây (Tree pre-order)
function extractLessonsFromTree(nodes: any[]): any[] {
  const result: any[] = [];
  function traverse(list: any[]) {
    if (!list || !Array.isArray(list)) return;
    for (const item of list) {
      if (item.children && Array.isArray(item.children) && item.children.length > 0) {
        traverse(item.children);
      } else if (!isNodeFolder(item)) {
        result.push(item);
      }
    }
  }
  traverse(nodes);
  return result;
}

function isLessonNodeCompleted(node: any): boolean {
  if (!node) return false;
  if (node.completed === true) return true;
  if (node.progress) {
    if (Array.isArray(node.progress)) {
      return node.progress.some((p: any) => Boolean(p.completed));
    }
    if (typeof node.progress === 'object') {
      return Boolean(node.progress.completed);
    }
  }
  return false;
}

// Component hiển thị đệ quy từng node: Phân biệt tuyệt đối giữa Folder vs File
function CourseTreeNode({
  node,
  courseId,
  completedIds,
  isLessonUnlocked,
  depth = 0,
}: {
  node: any;
  courseId: string;
  completedIds: Set<string>;
  isLessonUnlocked: (id: string) => boolean;
  depth?: number;
}) {
  const [isFolderOpen, setIsFolderOpen] = useState(true);
  const isFolder = isNodeFolder(node);

  // 1. NẾU LÀ FOLDER (Thư mục thật sự chứa các file con)
  if (isFolder) {
    const lessonCount = countLessonsRecursive(node);

    return (
      <div className="space-y-2">
        <div
          onClick={() => setIsFolderOpen(!isFolderOpen)}
          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {isFolderOpen ? (
              <ChevronDown className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
            )}
            <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
              {node.title}
            </span>
          </div>

          <span className="text-[11px] font-mono text-slate-500 shrink-0 ml-2">
            {lessonCount} bài học
          </span>
        </div>

        {isFolderOpen && node.children && (
          <div className="border-l border-slate-200 ml-3.5 pl-3.5 space-y-2 pt-1 pb-1">
            {node.children.map((child: any) => (
              <CourseTreeNode
                key={child.id}
                node={child}
                courseId={courseId}
                completedIds={completedIds}
                isLessonUnlocked={isLessonUnlocked}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. NẾU LÀ FILE (.mp4, .zip, .pdf hoặc bài học)
  const isDone = completedIds.has(String(node.id));
  const isUnlocked = isLessonUnlocked(String(node.id));
  const isExternal = node.url && !isVideoLink(node.url);
  const lowerTitle = (node.title || '').toLowerCase().trim();
  const isArchiveOrDoc = /\.(zip|rar|7z|tar|gz|pdf|docx|xlsx|doc|txt)$/i.test(lowerTitle);

  return (
    <div
      className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all group ${
        isDone
          ? 'bg-emerald-50/60 border-emerald-200'
          : isUnlocked
          ? 'bg-white hover:bg-slate-50 border-slate-200 hover:border-blue-300 shadow-xs'
          : 'bg-slate-100/70 border-slate-200'
      }`}
    >
      {/* Icon & Title */}
      <div className="flex items-center gap-3 min-w-0">
        {isDone ? (
          <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        ) : isUnlocked ? (
          isArchiveOrDoc ? (
            <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <FileText className="w-3 h-3" />
            </div>
          ) : isExternal ? (
            <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
              <ExternalLink className="w-3 h-3" />
            </div>
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
            </div>
          )
        ) : (
          <div className="w-6 h-6 rounded-full bg-slate-200/90 border border-slate-300 flex items-center justify-center text-slate-600 shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
        )}

        <span
          className={`text-xs sm:text-sm font-medium truncate transition-colors ${
            isDone
              ? 'text-slate-800'
              : isUnlocked
              ? 'text-slate-900 group-hover:text-blue-600'
              : 'text-slate-700 font-medium'
          }`}
        >
          {node.title}
        </span>
      </div>

      {/* Button Action: Đã học | Học Ngay ↗ | Khóa */}
      <div className="flex items-center gap-2 shrink-0">
        {isDone ? (
          <Link href={`/watch/${courseId}/${node.id}`}>
            <span className="px-3.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer">
              <Check className="w-3.5 h-3.5" />
              <span>Đã học</span>
            </span>
          </Link>
        ) : isUnlocked ? (
          <Link href={`/watch/${courseId}/${node.id}`}>
            <button className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all hover:scale-105 cursor-pointer">
              <span>Học Ngay</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </Link>
        ) : (
          <span
            className="px-3.5 py-1.5 rounded-lg bg-slate-200/90 text-slate-700 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-not-allowed select-none shadow-2xs"
            title="Vui lòng học xong bài trước để mở khóa bài này"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Khóa</span>
          </span>
        )}
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.id as string;
  const { user, isAdmin } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const query = user?.id ? `?userId=${encodeURIComponent(user.id)}` : '';
        const res = await fetch(`/api/courses/${courseId}${query}`);
        if (res.ok) {
          setCourse(await res.json());
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId, user?.id]);

  const toggleChapter = (chapId: string) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chapId]: !prev[chapId],
    }));
  };

  // Trích xuất danh sách bài học theo thứ tự thực tế trong cây (Tree order)
  const allLessons = useMemo(() => {
    if (!course) return [];
    const fromTree = extractLessonsFromTree(course.tree || []);
    if (fromTree.length > 0) return fromTree;
    return (course.nodes || [])
      .filter((n: any) => !isNodeFolder(n))
      .sort((a: any, b: any) => a.position - b.position);
  }, [course]);

  // Tập hợp các ID bài học đã hoàn thành
  const completedIds = useMemo(() => {
    const set = new Set<string>();
    for (const l of allLessons) {
      if (isLessonNodeCompleted(l)) {
        set.add(String(l.id));
      }
    }
    return set;
  }, [allLessons]);

  // Hàm kiểm tra bài học có được mở khóa không (khóa tuần tự nghiêm ngặt)
  const isLessonUnlocked = (lessonId: string): boolean => {
    const idStr = String(lessonId);
    const idx = allLessons.findIndex((l: any) => String(l.id) === idStr);
    if (idx <= 0) return true; // Bài đầu tiên luôn mở
    const prevLesson = allLessons[idx - 1];
    return completedIds.has(String(prevLesson.id));
  };

  const firstLessonId = allLessons[0]?.id;
  const nextUpLesson =
    allLessons.find((l: any) => !completedIds.has(String(l.id)) && isLessonUnlocked(String(l.id))) ||
    allLessons[0];

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-slate-400">
        Đang tải thông tin khóa học...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-slate-800">Không tìm thấy khóa học</p>
        <Link href="/courses">
          <Button variant="secondary" size="sm">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Breadcrumb Navigation */}
      <nav className="text-xs text-slate-500 font-medium flex items-center gap-2 flex-wrap">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Trang chủ
        </Link>
        <span className="text-slate-300">/</span>
        <Link href="/courses" className="hover:text-slate-900 transition-colors">
          Khóa Học Free
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs sm:max-w-md">{course.title}</span>
      </nav>

      {/* Hero Header Card */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 lg:p-8 space-y-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <span className="inline-block px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 font-mono">
            {course.category}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight leading-snug">
          {course.title}
        </h1>

        {/* Metadata info */}
        <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600 font-medium pt-1">
          <span className="flex items-center gap-1.5">
            <PlayCircle className="w-4 h-4 text-blue-600" />
            <span>{allLessons.length} bài học / tài liệu</span>
          </span>

          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>{course.totalChapters || course.tree?.length || 0} chương học</span>
          </span>

          {completedIds.size > 0 && (
            <span className="flex items-center gap-1.5 text-emerald-700 font-mono font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                Đã hoàn thành {completedIds.size}/{allLessons.length} ({course.progressPercentage}%)
              </span>
            </span>
          )}
        </div>

        {/* Nhật ký bài học gần nhất của học viên */}
        {course.lastActiveLesson && (
          <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-blue-700 uppercase font-bold block">
                  Nhật ký học lần trước:
                </span>
                <p className="font-semibold text-slate-900 truncate">
                  {course.lastActiveLesson.title}
                </p>
              </div>
            </div>

            <Link href={`/watch/${course.id}/${course.lastActiveLesson.lessonId}`}>
              <button className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shrink-0 shadow-2xs flex items-center gap-1.5 cursor-pointer">
                <span>Học tiếp bài này</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>
        )}

        {/* Action Button: Bắt đầu hoặc tiếp tục */}
        <div className="pt-3 flex flex-wrap items-center gap-3">
          {nextUpLesson ? (
            <Link href={`/watch/${course.id}/${nextUpLesson.id}`}>
              <button className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-transform hover:scale-105 cursor-pointer">
                <Play className="w-4 h-4 fill-current" />
                <span>{completedIds.size > 0 ? 'Tiếp tục bài học' : 'Bắt đầu học ngay'}</span>
              </button>
            </Link>
          ) : firstLessonId ? (
            <Link href={`/watch/${course.id}/${firstLessonId}`}>
              <button className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-transform hover:scale-105 cursor-pointer">
                <Play className="w-4 h-4 fill-current" />
                <span>Bắt đầu học ngay</span>
              </button>
            </Link>
          ) : (
            <Button disabled variant="secondary" size="md">
              Chưa có bài học
            </Button>
          )}

          {isAdmin && (
            <Link href={`/admin/courses/${course.id}`}>
              <Button variant="outline" size="md" className="gap-2 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50">
                <Sliders className="w-4 h-4 text-blue-600" />
                Quản trị bài học
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Section: Cấu Trúc Khóa Học & Bài Học Chi Tiết */}
      <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-7 space-y-6 shadow-sm">
        {/* Section Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Cấu Trúc Khóa Học & Bài Học Chi Tiết
            </h2>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {allLessons.length} bài học
          </span>
        </div>

        {/* Banner Lưu ý bắt buộc đăng nhập nếu chưa login */}
        {!user && (
          <div className="p-4 rounded-xl bg-blue-50/90 border border-blue-200 flex items-start gap-3 shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-blue-900">
                Yêu cầu đăng nhập tài khoản Google để học:
              </h4>
              <p className="text-blue-800 leading-relaxed">
                Bạn cần bấm nút <strong>&quot;Đăng nhập Google&quot;</strong> ở góc trên bên phải để mở khóa video bài học và lưu lại nhật ký học tập cá nhân.
              </p>
            </div>
          </div>
        )}

        {/* Banner Lưu ý mở khóa bài học tuần tự */}
        <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-3 shadow-2xs">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <h4 className="font-bold text-amber-900 flex items-center gap-1.5">
              <span>Quy tắc mở khóa tuần tự:</span>
            </h4>
            <p className="text-amber-800 leading-relaxed">
              Bạn cần học xong bài trước đó và bấm <strong>&quot;Đánh dấu đã học xong ✓&quot;</strong> thì bài học tiếp theo mới được mở khóa. Các bài sau sẽ hiển thị trạng thái <strong>Khóa</strong> cho đến khi hoàn thành bài liền trước.
            </p>
          </div>
        </div>

        {/* Chapters & Tree Structure */}
        <div className="space-y-3">
          {course.tree?.map((item: any) => {
            const isFolder = isNodeFolder(item);

            // NẾU LÀ FILE TRỰC TIẾP TẠI GỐC
            if (!isFolder) {
              return (
                <CourseTreeNode
                  key={item.id}
                  node={item}
                  courseId={course.id}
                  completedIds={completedIds}
                  isLessonUnlocked={isLessonUnlocked}
                  depth={0}
                />
              );
            }

            // NẾU LÀ CHƯƠNG / FOLDER
            const isCollapsed = Boolean(collapsedChapters[item.id]);
            const lessonCount = countLessonsRecursive(item);

            return (
              <div key={item.id} className="space-y-2">
                {/* Chapter Title Bar */}
                <div
                  onClick={() => toggleChapter(item.id)}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors select-none"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <Folder className="w-4 h-4 text-amber-500 fill-amber-500/20 shrink-0" />
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                      {item.title}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-500 shrink-0 ml-2">
                    {lessonCount} bài học
                  </span>
                </div>

                {/* Nội dung bên trong chương: File hoặc Thư mục con */}
                {!isCollapsed && item.children && (
                  <div className="border-l border-slate-200 ml-4 sm:ml-5 pl-3.5 sm:pl-4 space-y-2 pt-1 pb-2">
                    {item.children.map((childNode: any) => (
                      <CourseTreeNode
                        key={childNode.id}
                        node={childNode}
                        courseId={course.id}
                        completedIds={completedIds}
                        isLessonUnlocked={isLessonUnlocked}
                        depth={1}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
