'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  CheckCircle2,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Lock,
  PlayCircle,
  Folder,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { VideoPlayer } from '@/components/video/VideoPlayer';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

function isVideoLink(url?: string | null): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  if (lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com')) return true;
  if ((lower.includes('drive.google.com') || lower.includes('docs.google.com')) && lower.includes('/file/d/')) return true;
  const exts = ['.mp4', '.webm', '.ogg', '.mov', '.m4v', '.m3u8'];
  return exts.some((ext) => lower.includes(ext));
}

// Phân biệt Folder vs File
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

// Component hiển thị sidebar đệ quy đa cấp (Mở khóa toàn bộ + Đánh dấu xanh)
function SidebarTreeNode({
  node,
  courseId,
  currentLessonId,
  completedIds,
  onToggleLesson,
}: {
  node: any;
  courseId: string;
  currentLessonId: string;
  completedIds: Set<string>;
  onToggleLesson: (lessonId: string, nextState: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isFolder = isNodeFolder(node);

  // 1. NẾU LÀ FOLDER
  if (isFolder) {
    const lessonCount = countLessonsRecursive(node);

    return (
      <div className="space-y-1">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 cursor-pointer select-none transition-colors"
        >
          <div className="flex items-center gap-2 truncate">
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            )}
            <Folder className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20 shrink-0" />
            <span className="truncate">{node.title}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            {lessonCount}
          </span>
        </div>

        {isOpen && node.children && (
          <div className="border-l border-slate-200 ml-3 pl-2.5 space-y-1.5 pt-0.5">
            {node.children.map((child: any) => (
              <SidebarTreeNode
                key={child.id}
                node={child}
                courseId={courseId}
                currentLessonId={currentLessonId}
                completedIds={completedIds}
                onToggleLesson={onToggleLesson}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. NẾU LÀ FILE - TẤT CẢ ĐỀU MỞ KHÓA, ĐÁNH DẤU HIỂN THỊ MÀU XANH
  const isCurrent = String(node.id) === String(currentLessonId);
  const isDone = completedIds.has(String(node.id));
  const isExternal = node.url && !isVideoLink(node.url);

  // BÀI ĐANG MỞ XEM
  if (isCurrent) {
    return (
      <div
        className={`border-l-4 border-y border-r rounded-r-lg p-3 shadow-xs transition-all ${
          isDone
            ? 'bg-emerald-50/90 border-l-emerald-600 border-emerald-300'
            : 'bg-blue-50/80 border-l-blue-600 border-blue-200'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <button
            type="button"
            onClick={() => onToggleLesson(String(node.id), !isDone)}
            title={isDone ? 'Bỏ đánh dấu đã học' : 'Đánh dấu đã học (chuyển màu xanh)'}
            className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-xs cursor-pointer transition-colors ${
              isDone ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white hover:bg-emerald-600'
            }`}
          >
            {isDone ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide uppercase text-white ${
                  isDone ? 'bg-emerald-600' : 'bg-blue-600'
                }`}
              >
                {isDone ? '✓ ĐANG XEM • ĐÃ HỌC' : '▶ ĐANG HỌC'}
              </span>
              {node.duration && (
                <span
                  className={`text-[10px] font-mono font-medium ${
                    isDone ? 'text-emerald-700' : 'text-blue-700'
                  }`}
                >
                  {node.duration}
                </span>
              )}
            </div>
            <p
              className={`text-xs font-semibold leading-snug line-clamp-2 ${
                isDone ? 'text-emerald-950' : 'text-blue-950'
              }`}
            >
              {node.title}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ĐÃ ĐÁNH DẤU HOÀN THÀNH (MÀU XANH LÁ NỔI BẬT)
  if (isDone) {
    return (
      <div className="p-2.5 rounded-lg bg-emerald-50/90 hover:bg-emerald-100/80 border border-emerald-300 transition-colors group flex items-start gap-2.5 shadow-2xs">
        <button
          type="button"
          onClick={() => onToggleLesson(String(node.id), false)}
          title="Bấm để bỏ đánh dấu đã học"
          className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 cursor-pointer hover:bg-emerald-700 transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>

        <Link href={`/watch/${courseId}/${node.id}`} className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[10px] font-mono text-emerald-700 font-bold">
              ✓ Đã học xong
            </span>
            {node.duration && (
              <span className="text-[10px] font-mono text-emerald-600">
                {node.duration}
              </span>
            )}
          </div>
          <p className="text-xs font-semibold text-emerald-950 group-hover:text-emerald-700 leading-snug line-clamp-2 transition-colors">
            {node.title}
          </p>
        </Link>
      </div>
    );
  }

  // CHƯA ĐÁNH DẤU (MỞ KHÓA SẴN)
  return (
    <div className="p-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors group shadow-2xs flex items-start gap-2.5">
      <button
        type="button"
        onClick={() => onToggleLesson(String(node.id), true)}
        title="Bấm để đánh dấu đã học (chuyển màu xanh)"
        className="w-5 h-5 rounded-full bg-slate-100 hover:bg-emerald-50 border border-slate-300 hover:border-emerald-500 text-slate-400 hover:text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors"
      >
        {isExternal ? (
          <ExternalLink className="w-3 h-3" />
        ) : (
          <PlayCircle className="w-3.5 h-3.5" />
        )}
      </button>

      <Link href={`/watch/${courseId}/${node.id}`} className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span className="text-[10px] font-mono text-slate-400">
            {isExternal ? 'Tài liệu' : 'Chưa đánh dấu'}
          </span>
          {node.duration && (
            <span className="text-[10px] font-mono text-slate-400">
              {node.duration}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-700 group-hover:text-blue-600 leading-snug line-clamp-2 transition-colors font-medium">
          {node.title}
        </p>
      </Link>
    </div>
  );
}

interface WatchLessonClientProps {
  courseId: string;
  courseTitle: string;
  tree: any[];
  currentLesson: any;
  chapterTitle?: string;
  initialCompleted: boolean;
  initialLastPosition: number;
  allLessonsFlat: { id: string; title: string; courseId: string; completed?: boolean }[];
}

export function WatchLessonClient({
  courseId,
  courseTitle,
  tree,
  currentLesson,
  chapterTitle,
  initialCompleted,
  initialLastPosition,
  allLessonsFlat,
}: WatchLessonClientProps) {
  const router = useRouter();
  const { user, isAuthLoaded, isGoogleConfigured, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeUserId = user?.id || '';

  // Tập hợp các bài học đã hoàn thành
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    for (const l of allLessonsFlat) {
      if (l.completed) set.add(String(l.id));
    }
    if (initialCompleted) set.add(String(currentLesson.id));
    return set;
  });

  // Khi user đăng nhập thành công, tải tiến độ học riêng của user đó & ghi nhận bài đang học
  useEffect(() => {
    if (!user?.id || !currentLesson?.id) return;

    fetch(`/api/courses/${courseId}?userId=${encodeURIComponent(user.id)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.nodes)) {
          const userCompleted = new Set<string>();
          for (const node of data.nodes) {
            if (Array.isArray(node.progress) && node.progress.some((p: any) => p.completed)) {
              userCompleted.add(String(node.id));
            }
          }
          setCompletedIds(userCompleted);
        }
      })
      .catch(() => {});

    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        lessonId: currentLesson.id,
        lastPosition: initialLastPosition || 0,
      }),
    }).catch(() => {});
  }, [currentLesson?.id, user?.id, courseId]);

  const isCompleted = completedIds.has(String(currentLesson.id));

  // Vị trí của bài hiện tại trong danh sách phẳng
  const currentIndex = allLessonsFlat.findIndex((l) => String(l.id) === String(currentLesson.id));
  const prevLesson = currentIndex > 0 ? allLessonsFlat[currentIndex - 1] : null;
  const nextLesson =
    currentIndex !== -1 && currentIndex < allLessonsFlat.length - 1
      ? allLessonsFlat[currentIndex + 1]
      : null;

  // Tính toán tiến độ học
  const totalLessons = allLessonsFlat.length;
  const completedCount = completedIds.size;
  const progressPercent =
    totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  // Mở khóa toàn bộ bài học và hỗ trợ đánh dấu xanh bất kỳ bài nào
  const handleToggleLessonById = async (targetLessonId: string, nextState: boolean) => {
    setCompletedIds((prev) => {
      const nextSet = new Set(prev);
      if (nextState) {
        nextSet.add(String(targetLessonId));
      } else {
        nextSet.delete(String(targetLessonId));
      }
      return nextSet;
    });

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          lessonId: targetLessonId,
          completed: nextState,
        }),
      });
    } catch (e) {
      // ignore
    }
  };

  const handleToggleCompleted = () => {
    handleToggleLessonById(String(currentLesson.id), !isCompleted);
  };

  const handlePositionUpdate = async (seconds: number) => {
    if (!user?.id) return;
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          lessonId: currentLesson.id,
          lastPosition: seconds,
        }),
      });
    } catch (e) {}
  };

  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-xs text-slate-400">
        Đang kiểm tra trạng thái đăng nhập...
      </div>
    );
  }

  // BẮT BUỘC ĐĂNG NHẬP KHI HỌC
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-8 text-center space-y-5 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto text-blue-600 shadow-xs">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900">Yêu Cầu Đăng Nhập Để Học</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vui lòng đăng nhập bằng tài khoản Google của bạn để mở khóa nội dung bài học và lưu lại tiến độ học tập.
            </p>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left">
            <p className="text-[11px] text-slate-400 font-mono uppercase">Khóa học đang chọn</p>
            <p className="text-xs font-bold text-slate-800 truncate mt-0.5">{courseTitle}</p>
            <p className="text-[11px] text-blue-600 truncate mt-0.5">{currentLesson?.title}</p>
          </div>

          {isGoogleConfigured ? (
            <div className="py-1 flex justify-center">
              <GoogleAuthButton />
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800">
              Chưa cấu hình Google Client ID trong file .env.local.
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <Link href={`/courses/${courseId}`}>
              <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-slate-800 gap-1.5">
                <ChevronLeft className="w-3.5 h-3.5" />
                Quay lại trang khóa học
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-100 text-slate-900">
      {/* Top Header Navigation */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 lg:px-6 flex items-center justify-between shrink-0 select-none z-30 shadow-xs">
        {/* Left: Back & Course Title */}
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href={`/courses/${courseId}`}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shrink-0 cursor-pointer shadow-xs"
          >
            <ChevronLeft className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Quay lại khóa học</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-xs md:max-w-md lg:max-w-lg">
              {courseTitle}
            </h1>
            {chapterTitle && (
              <span className="hidden xl:inline-block px-2 py-0.5 rounded text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200 truncate max-w-[200px]">
                {chapterTitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: Progress Pill & Sidebar Toggle */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono">
            <span className="text-slate-500 text-[11px]">Tiến độ:</span>
            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-blue-700 font-bold text-[11px]">
              {completedCount}/{totalLessons} ({progressPercent}%)
            </span>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            title={sidebarOpen ? 'Thu gọn danh sách bài' : 'Mở danh sách bài'}
          >
            {sidebarOpen ? (
              <PanelRightClose className="w-4 h-4 text-blue-600" />
            ) : (
              <PanelRightOpen className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Stage */}
        <div className="flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-6 flex flex-col items-center custom-scrollbar">
          <div className="w-full max-w-5xl 2xl:max-w-6xl space-y-4">
            <VideoPlayer
              url={currentLesson.url}
              lessonTitle={currentLesson.title}
              initialPosition={initialLastPosition}
              onPositionUpdate={handlePositionUpdate}
              onEnded={() => {
                if (!isCompleted) handleToggleCompleted();
              }}
            />

            {/* Video Meta & Control Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
              {/* Row 1: Tiêu đề & Nút bấm */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {chapterTitle && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        {chapterTitle}
                      </span>
                    )}
                    {isCompleted ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Đã đánh dấu hoàn thành
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono text-blue-700 bg-blue-50 border border-blue-200 flex items-center gap-1 font-semibold">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        Đang học bài này
                      </span>
                    )}
                  </div>

                  <h1 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 tracking-tight leading-snug">
                    {currentLesson.title}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {currentLesson.url && (
                    <a
                      href={
                        currentLesson.url.startsWith('http://') || currentLesson.url.startsWith('https://')
                          ? currentLesson.url
                          : `https://${currentLesson.url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-xs h-9 text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50 font-semibold shadow-xs"
                        title="Mở liên kết gốc trong tab mới"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                        <span>Mở liên kết (Redirect)</span>
                      </Button>
                    </a>
                  )}

                  <Button
                    variant={isCompleted ? 'secondary' : 'primary'}
                    size="sm"
                    onClick={handleToggleCompleted}
                    className={`gap-2 shrink-0 h-9 px-4 text-xs font-semibold cursor-pointer transition-all ${
                      isCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-xs'
                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>{isCompleted ? 'Đã học xong ✓ (Bấm để bỏ)' : 'Đánh dấu đã học xong'}</span>
                  </Button>
                </div>
              </div>

              {/* Row 2: Điều hướng */}
              <div className="flex items-center justify-between pt-1 text-xs">
                {prevLesson ? (
                  <Link href={`/watch/${courseId}/${prevLesson.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold shadow-xs">
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span>Bài trước</span>
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}

                <div className="text-center font-mono text-[11px] text-slate-500 hidden sm:block">
                  Bài {currentIndex + 1} trên tổng số {totalLessons} bài học
                </div>

                {nextLesson ? (
                  <Link href={`/watch/${courseId}/${nextLesson.id}`}>
                    <Button variant="primary" size="sm" className="gap-1.5 h-8 text-xs shadow-xs font-semibold">
                      <span>Bài tiếp theo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                ) : (
                  <div />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Danh Sách Bài Học */}
        {sidebarOpen && (
          <aside className="w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 select-none shadow-xs">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase font-bold block">
                  LỘ TRÌNH HỌC TẬP
                </span>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {totalLessons} bài học
                </p>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-700">
                  {completedCount}/{totalLessons} đã đánh dấu
                </span>
              </div>
            </div>

            {/* Hộp hướng dẫn đánh dấu xanh */}
            <div className="m-3 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã mở khóa toàn bộ bài học</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Bấm vào biểu tượng tròn ở đầu mỗi bài học hoặc nút <strong>&quot;Đánh dấu đã học xong&quot;</strong> để tô xanh các bài bạn đã hoàn thành.
              </p>
            </div>

            {/* Sidebar Lesson Tree List */}
            <div className="flex-1 overflow-y-auto p-3 pt-0 space-y-1.5 custom-scrollbar">
              {tree && tree.length > 0 ? (
                tree.map((node: any) => (
                  <SidebarTreeNode
                    key={node.id}
                    node={node}
                    courseId={courseId}
                    currentLessonId={currentLesson.id}
                    completedIds={completedIds}
                    onToggleLesson={handleToggleLessonById}
                  />
                ))
              ) : (
                allLessonsFlat.map((l: any) => (
                  <SidebarTreeNode
                    key={l.id}
                    node={l}
                    courseId={courseId}
                    currentLessonId={currentLesson.id}
                    completedIds={completedIds}
                    onToggleLesson={handleToggleLessonById}
                  />
                ))
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
