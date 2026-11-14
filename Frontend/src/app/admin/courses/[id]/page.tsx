'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Plus,
  Trash2,
  Save,
  PlayCircle,
  Layers,
  Settings,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';

interface LessonItem {
  id: string;
  type: 'lesson';
  title: string;
  url: string;
  duration: string;
}

interface ChapterItem {
  id: string;
  type: 'chapter';
  title: string;
  children: LessonItem[];
}

export default function EditCourseCurriculumPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const { isAdmin } = useAuth();

  const [course, setCourse] = useState<any>(null);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showMetaEdit, setShowMetaEdit] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [categoriesList, setCategoriesList] = useState<string[]>(['Lập trình', 'Ngoại ngữ', 'Thiết kế']);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [res, catRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`),
          fetch('/api/categories'),
        ]);

        if (catRes.ok) {
          const catsData = await catRes.json();
          const names = catsData.map((c: any) => c.name).filter((n: string) => n && n !== 'Tất cả');
          setCategoriesList(Array.from(new Set(['Lập trình', 'Ngoại ngữ', 'Thiết kế', ...names])));
        }

        if (res.ok) {
          const data = await res.json();
          setCourse(data);
          setChapters(data.tree || []);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [courseId]);

  // Thêm chương mới
  const addChapter = () => {
    const newChap: ChapterItem = {
      id: `chap_${Date.now()}`,
      type: 'chapter',
      title: `Chương ${chapters.length + 1}: Tiêu đề chương mới`,
      children: [],
    };
    setChapters([...chapters, newChap]);
  };

  // Xóa chương
  const removeChapter = (chapId: string) => {
    if (!confirm('Xóa chương này và toàn bộ bài học bên trong?')) return;
    setChapters(chapters.filter((c) => c.id !== chapId));
  };

  // Sửa tiêu đề chương
  const updateChapterTitle = (chapId: string, title: string) => {
    setChapters(
      chapters.map((c) => (c.id === chapId ? { ...c, title } : c))
    );
  };

  // Thêm bài học vào chương
  const addLesson = (chapId: string) => {
    setChapters(
      chapters.map((c) => {
        if (c.id !== chapId) return c;
        const newLesson: LessonItem = {
          id: `les_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          type: 'lesson',
          title: `Bài ${c.children.length + 1}: Tên bài học mới`,
          url: '',
          duration: '',
        };
        return {
          ...c,
          children: [...c.children, newLesson],
        };
      })
    );
  };

  // Sửa bài học
  const updateLesson = (
    chapId: string,
    lessonId: string,
    field: 'title' | 'url' | 'duration',
    val: string
  ) => {
    setChapters(
      chapters.map((c) => {
        if (c.id !== chapId) return c;
        return {
          ...c,
          children: c.children.map((l) =>
            l.id === lessonId ? { ...l, [field]: val } : l
          ),
        };
      })
    );
  };

  // Xóa bài học
  const removeLesson = (chapId: string, lessonId: string) => {
    setChapters(
      chapters.map((c) => {
        if (c.id !== chapId) return c;
        return {
          ...c,
          children: c.children.filter((l) => l.id !== lessonId),
        };
      })
    );
  };

  // Lưu cây bài học và thông tin khóa học vào backend
  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      // Lưu thông tin khóa học
      await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: course.title,
          category: course.category,
        }),
      });

      // Lưu cây chương và bài học
      const res = await fetch(`/api/courses/${courseId}/nodes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tree: chapters }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-md mx-auto my-16 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-xs">
        <h2 className="text-base font-bold text-slate-900">Yêu Cầu Quyền Quản Trị (Admin)</h2>
        <p className="text-xs text-slate-600">
          Chỉ tài khoản <strong>maivanhung0604@gmail.com</strong> mới có quyền chỉnh sửa nội dung khóa học.
        </p>
        <Link href="/">
          <Button variant="secondary" size="sm" className="mt-2">Quay lại Trang chủ</Button>
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-24 text-center text-xs text-[#71717A]">
        Đang tải trình chỉnh sửa...
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-in fade-in duration-150 text-slate-900">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/admin"
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base lg:text-lg font-bold text-slate-900 truncate max-w-md">
              {course?.title}
            </h1>
            <p className="text-xs text-slate-500">
              Quản trị chương mục & video bài học
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/courses/${courseId}`} target="_blank">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-semibold shadow-xs">
              <ExternalLink className="w-3.5 h-3.5" />
              Xem trang học
            </Button>
          </Link>

          {saveSuccess && (
            <span className="text-xs font-mono text-emerald-600 flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" /> Đã lưu
            </span>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="gap-1.5 h-8 text-xs font-semibold shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving ? 'Đang lưu...' : 'Lưu Tất Cả'}
          </Button>
        </div>
      </div>

      {/* Thông tin khóa học (Tiêu đề & Danh mục) */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs">
        <div
          onClick={() => setShowMetaEdit(!showMetaEdit)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-900">
              Cài đặt Tên khóa học & Danh mục
            </span>
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">
            {showMetaEdit ? 'Thu gọn' : 'Chỉnh sửa'}
          </span>
        </div>

        {showMetaEdit && (
          <div className="pt-3 border-t border-slate-100 space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-semibold">Tên khóa học</label>
                <input
                  type="text"
                  value={course.title}
                  onChange={(e) => setCourse({ ...course, title: e.target.value })}
                  className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-slate-900 focus:bg-white focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-600 font-semibold">Danh mục</label>
                  <button
                    type="button"
                    onClick={() => setIsCustomCategory(!isCustomCategory)}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer font-medium"
                  >
                    {isCustomCategory ? '← Chọn từ danh sách' : '+ Nhập danh mục mới'}
                  </button>
                </div>

                {isCustomCategory ? (
                  <input
                    type="text"
                    value={course.category}
                    onChange={(e) => setCourse({ ...course, category: e.target.value })}
                    placeholder="Nhập tên danh mục mới..."
                    className="w-full h-8 bg-slate-50 border border-blue-500 rounded-lg px-2.5 text-slate-900 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  />
                ) : (
                  <select
                    value={course.category}
                    onChange={(e) => setCourse({ ...course, category: e.target.value })}
                    className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg px-2 text-slate-900 focus:bg-white focus:border-blue-500 outline-none cursor-pointer transition-all"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chapters & Lessons Editor */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase text-slate-500 tracking-wider font-semibold">
            Cấu Trúc Chương & Bài Học Video ({chapters.length} chương)
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={addChapter}
            className="h-7 text-xs gap-1 font-semibold"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            Thêm Chương
          </Button>
        </div>

        {chapters.map((chap) => (
          <div
            key={chap.id}
            className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-xs"
          >
            {/* Chapter Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Layers className="w-4 h-4 text-blue-600 shrink-0" />
                <input
                  type="text"
                  value={chap.title}
                  onChange={(e) => updateChapterTitle(chap.id, e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-900 font-bold flex-1 outline-none focus:bg-white focus:border-blue-500 transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addLesson(chap.id)}
                  className="h-7 text-xs gap-1 font-semibold"
                >
                  <Plus className="w-3 h-3 text-blue-600" />
                  Thêm bài học
                </Button>
                <button
                  onClick={() => removeChapter(chap.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Xóa chương"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lessons List in Chapter */}
            <div className="space-y-2 pt-1 pl-4 border-l border-slate-200">
              {chap.children.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-1">
                  Chương này chưa có bài học. Bấm "+ Thêm bài học" ở trên.
                </p>
              ) : (
                chap.children.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs"
                  >
                    <PlayCircle className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />

                    <input
                      type="text"
                      value={lesson.title}
                      onChange={(e) =>
                        updateLesson(chap.id, lesson.id, 'title', e.target.value)
                      }
                      placeholder="Tên bài học"
                      className="bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-900 flex-1 outline-none focus:border-blue-500 font-medium"
                    />

                    <input
                      type="text"
                      value={lesson.url}
                      onChange={(e) =>
                        updateLesson(chap.id, lesson.id, 'url', e.target.value)
                      }
                      placeholder="Link video (MP4 hoặc YouTube)"
                      className="bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-900 font-mono flex-1 outline-none focus:border-blue-500"
                    />

                    <input
                      type="text"
                      value={lesson.duration}
                      onChange={(e) =>
                        updateLesson(chap.id, lesson.id, 'duration', e.target.value)
                      }
                      placeholder="Thời lượng (12:30)"
                      className="bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-900 font-mono w-24 outline-none focus:border-blue-500"
                    />

                    <button
                      onClick={() => removeLesson(chap.id, lesson.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 shrink-0 self-end sm:self-auto transition-colors"
                      title="Xóa bài học"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
