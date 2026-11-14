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

// Component hiển thị sidebar đệ quy đa cấp
function SidebarTreeNode({
  node,
  courseId,
  currentLessonId,
  completedIds,
  isLessonUnlocked,
}: {
  node: any;
  courseId: string;
  currentLessonId: string;
  completedIds: Set<string>;
  isLessonUnlocked: (id: string) => boolean;
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
                isLessonUnlocked={isLessonUnlocked}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2. NẾU LÀ FILE
  const isCurrent = String(node.id) === String(currentLessonId);
  const isDone = completedIds.has(String(node.id));
  const isUnlocked = isLessonUnlocked(String(node.id));
  const isExternal = node.url && !isVideoLink(node.url);

  // ĐANG HỌC
  if (isCurrent) {
    return (
      <div className="bg-blue-50/80 border-l-4 border-blue-600 border-y border-r border-blue-200 rounded-r-lg p-3 shadow-xs transition-all">
        <div className="flex items-start gap-2.5">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-wide uppercase bg-blue-600 text-white">
                ▶ ĐANG HỌC
              </span>
              {node.duration && (
                <span className="text-[10px] font-mono text-blue-700 font-medium">
                  {node.duration}
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-blue-950 leading-snug line-clamp-2">
              {node.title}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ĐÃ HOÀN THÀNH
  if (isDone) {
    return (
      <Link
        href={`/watch/${courseId}/${node.id}`}
        className="block p-2.5 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 transition-colors group"
      >
        <div className="flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                ✓ Đã xong
              </span>
              {node.duration && (
                <span className="text-[10px] font-mono text-slate-400">
                  {node.duration}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-800 group-hover:text-blue-600 leading-snug line-clamp-2 transition-colors">
              {node.title}
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // ĐÃ MỞ KHÓA
  if (isUnlocked) {
    return (
      <Link
        href={`/watch/${courseId}/${node.id}`}
        className="block p-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 transition-colors group shadow-2xs"
      >
        <div className="flex items-start gap-2.5">
          {isExternal ? (
            <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          ) : (
            <PlayCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 mt-0.5 transition-colors" />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className="text-[10px] font-mono text-slate-400">
                {isExternal ? 'Tài liệu' : 'Chưa học'}
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
          </div>
        </div>
      </Link>
    );
  }

  // ĐANG KHÓA
  return (
    <div
      className="p-2.5 rounded-lg bg-slate-100/70 border border-slate-200 cursor-not-allowed select-none group"
      title="Cần học xong bài trước và đánh dấu hoàn thành để mở khóa bài này"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-5 h-5 rounded-md bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-3 h-3 text-slate-500" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[10px] font-mono text-slate-600 font-medium">
              Chưa mở khóa
            </span>
            {node.duration && (
              <span className="text-[10px] font-mono text-slate-500">
                {node.duration}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-700 font-medium leading-snug line-clamp-2">
            {node.title}
          </p>
        </div>
      </div>
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

  // Quy tắc mở khóa tuần tự:
  const isLessonUnlocked = (lessonId: string): boolean => {
    const idStr = String(lessonId);
    const idx = allLessonsFlat.findIndex((l) => String(l.id) === idStr);
    if (idx <= 0) return true;
    const prev = allLessonsFlat[idx - 1];
    return completedIds.has(String(prev.id));
  };

  const isCurrentLessonUnlocked = isLessonUnlocked(currentLesson.id);
  const isNextLessonUnlocked = nextLesson ? isLessonUnlocked(nextLesson.id) : false;

  const handleToggleCompleted = async () => {
    const nextState = !isCompleted;

    setCompletedIds((prev) => {
      const nextSet = new Set(prev);
      if (nextState) {
        nextSet.add(String(currentLesson.id));
      } else {
        nextSet.delete(String(currentLesson.id));
      }
      return nextSet;
    });

    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: activeUserId,
          lessonId: currentLesson.id,
          completed: nextState,
        }),
      });
    } catch (e) {
      // ignore
    }
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
            {!isCurrentLessonUnlocked ? (
              <div className="aspect-video w-full bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center space-y-3 shadow-md">
                <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-500 shadow-xs">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Bài Học Này Đang Bị Khóa
                </h2>
                <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                  Bạn cần học xong và đánh dấu hoàn thành bài học trước đó để mở khóa bài học này.
                </p>
                {prevLesson && (
                  <Link href={`/watch/${courseId}/${prevLesson.id}`}>
                    <Button variant="primary" size="sm" className="gap-2 mt-2">
                      <ChevronLeft className="w-4 h-4" />
                      Quay lại: {prevLesson.title}
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <VideoPlayer
                url={currentLesson.url}
                lessonTitle={currentLesson.title}
                initialPosition={initialLastPosition}
                onPositionUpdate={handlePositionUpdate}
                onEnded={() => {
                  if (!isCompleted) handleToggleCompleted();
                }}
              />
            )}

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
                        Đã hoàn thành bài học
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

                  {isCurrentLessonUnlocked && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
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
                        <span>{isCompleted ? 'Đã hoàn thành ✓' : 'Đánh dấu đã học xong'}</span>
                      </Button>
                      {!isCompleted && (
                        <span className="text-[11px] text-amber-700 font-medium bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                          ⚡ Đánh dấu bài này để mở khóa bài tiếp theo
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Thông báo mở khóa bài tiếp theo */}
              {isCompleted && nextLesson && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs animate-in fade-in">
                  <span className="text-emerald-800 flex items-center gap-2 font-semibold">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Tuyệt vời! Bạn đã hoàn thành bài này. Bài tiếp theo đã được mở khóa!
                  </span>
                  <Link href={`/watch/${courseId}/${nextLesson.id}`}>
                    <span className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors inline-flex items-center gap-1 shadow-xs">
                      Học ngay <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </div>
              )}

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

                {nextLesson && (
                  isNextLessonUnlocked ? (
                    <Link href={`/watch/${courseId}/${nextLesson.id}`}>
                      <Button variant="primary" size="sm" className="gap-1.5 h-8 text-xs shadow-xs font-semibold">
                        <span>Bài tiếp theo</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled
                      className="gap-1.5 h-8 text-xs opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200"
                      title="Hoàn thành bài này trước để mở khóa bài tiếp theo"
                    >
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Bài tiếp theo (Đang khóa)</span>
                    </Button>
                  )
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
                <span className="text-xs font-mono font-bold text-blue-700">
                  {completedCount}/{totalLessons} hoàn thành
                </span>
              </div>
            </div>

            {/* Hộp Chú Ý Quan Trọng Mở Khóa Tuần Tự */}
            <div className="m-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Chú ý: Mở khóa tuần tự</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Bạn cần học xong bài trước đó và bấm nút <strong>&quot;Đánh dấu đã học xong ✓&quot;</strong> thì bài học tiếp theo mới được mở khóa.
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
                    isLessonUnlocked={isLessonUnlocked}
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
                    isLessonUnlocked={isLessonUnlocked}
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
