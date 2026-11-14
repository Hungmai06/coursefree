'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Plus,
  Trash2,
  Edit,
  ShieldAlert,
  X,
  BookOpen,
  Bot,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Send,
  MessageSquare,
  Save,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';

const AI_PROMPT_TEMPLATE = `Bạn là AI chuyên phân tích cấu trúc khóa học.

Đầu vào là danh sách chương, thư mục, bài học hoặc văn bản tự do.

Hãy chuyển đổi thành JSON theo các quy tắc sau:

- Mỗi node gồm:
  - type: "chapter", "folder" hoặc "lesson"
  - title: tên chương/thư mục/bài học
  - url: chỉ có ở lesson (nếu có link)
  - children: mảng các node con (nếu là chapter hoặc folder)

- Hỗ trợ folder lồng nhau không giới hạn.
- Giữ nguyên thứ tự xuất hiện.
- Nếu một bài không có link thì vẫn tạo lesson và bỏ trường url.
- Chỉ trả về JSON hợp lệ, không giải thích, không dùng Markdown.

Ví dụ:

Input:
Chương 1
- Bài 1
https://example.com/1
- Source
  - Demo 1
  https://example.com/demo1

Output:
{
  "title": "Khóa học",
  "children": [
    {
      "type": "chapter",
      "title": "Chương 1",
      "children": [
        {
          "type": "lesson",
          "title": "Bài 1",
          "url": "https://example.com/1"
        },
        {
          "type": "folder",
          "title": "Source",
          "children": [
            {
              "type": "lesson",
              "title": "Demo 1",
              "url": "https://example.com/demo1"
            }
          ]
        }
      ]
    }
  ]
}`;

export default function AdminPage() {
  const { user, isAdmin } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New course state
  const [newCourse, setNewCourse] = useState({
    title: '',
    category: 'Lập trình',
  });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  // AI Structure JSON state
  const [structureJson, setStructureJson] = useState('');
  const [showPromptDetails, setShowPromptDetails] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Community Links (Zalo & Telegram) state
  const [zaloUrl, setZaloUrl] = useState('');
  const [telegramUrl, setTelegramUrl] = useState('');
  const [savingCommunity, setSavingCommunity] = useState(false);
  const [communitySaved, setCommunitySaved] = useState(false);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/courses');
      if (res.ok) setCourses(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadCommunityConfig = async () => {
    try {
      const res = await fetch('/api/config/community');
      if (res.ok) {
        const data = await res.json();
        setZaloUrl(data.zaloUrl || '');
        setTelegramUrl(data.telegramUrl || '');
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadCourses();
    loadCommunityConfig();
  }, []);

  const handleSaveCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingCommunity(true);
      const res = await fetch('/api/config/community', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zaloUrl, telegramUrl }),
      });
      if (res.ok) {
        setCommunitySaved(true);
        setTimeout(() => setCommunitySaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingCommunity(false);
    }
  };

  // Tổng hợp tất cả danh mục hiện có từ DB và các danh mục chuẩn
  const existingCategories = useMemo(() => {
    return Array.from(
      new Set([
        'Lập trình',
        'Ngoại ngữ',
        'Thiết kế',
        ...courses.map((c) => c.category).filter(Boolean),
      ])
    );
  }, [courses]);

  // Kiểm tra tính hợp lệ của JSON do AI tạo
  const jsonAnalysis = useMemo(() => {
    const raw = structureJson.trim();
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.children)
        ? parsed.children
        : [];

      let chapters = 0;
      let folders = 0;
      let lessons = 0;

      const traverse = (items: any[]) => {
        for (const it of items) {
          if (it.type === 'chapter') chapters++;
          else if (it.type === 'folder') folders++;
          else if (it.type === 'lesson') lessons++;
          if (it.children && Array.isArray(it.children)) {
            traverse(it.children);
          }
        }
      };
      traverse(nodes);

      return {
        valid: true as const,
        title: parsed.title || null,
        chapters,
        folders,
        lessons,
        totalNodes: chapters + folders + lessons,
      };
    } catch (err: any) {
      return {
        valid: false as const,
        error: 'JSON chưa đúng cú pháp. Vui lòng kiểm tra lại.',
      };
    }
  }, [structureJson]);

  // Tự động điền tiêu đề từ JSON nếu tiêu đề đang trống
  const handleJsonChange = (val: string) => {
    setStructureJson(val);
    try {
      const parsed = JSON.parse(val.trim());
      if (parsed.title && !newCourse.title.trim()) {
        setNewCourse((prev) => ({ ...prev, title: parsed.title }));
      }
    } catch {
      // ignore parse error
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title.trim()) return;

    const finalCategory = isCustomCategory
      ? customCategoryName.trim()
      : newCourse.category;

    if (!finalCategory) {
      alert('Vui lòng nhập hoặc chọn danh mục cho khóa học');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newCourse.title.trim(),
          category: finalCategory,
          structureJson: structureJson.trim() || undefined,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewCourse({
          title: '',
          category: finalCategory,
        });
        setStructureJson('');
        setIsCustomCategory(false);
        setCustomCategoryName('');
        loadCourses();
      } else {
        const err = await res.json();
        alert(err.error || 'Có lỗi xảy ra khi tạo khóa học');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khóa học "${title}"?`)) return;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Nếu chưa đăng nhập Admin hoặc không phải maivanhung0604@gmail.com
  if (!isAdmin) {
    return (
      <div className="p-8 max-w-lg mx-auto my-16 bg-white border border-slate-200 rounded-2xl text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600 shadow-xs">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Yêu Cầu Quyền Quản Trị (Admin)</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          Trang quản trị chỉ dành riêng cho tài khoản Google có email <strong>maivanhung0604@gmail.com</strong>.
          {user ? ` Tài khoản hiện tại (${user.email}) là Học Viên.` : ' Bạn chưa đăng nhập.'}
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
          <Link href="/">
            <Button variant="secondary" size="sm" className="shadow-xs font-semibold">
              Quay về Trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-150 text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            Quản Trị Khóa Học
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Thêm khóa học mới và quản lý nội dung bài học
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setIsCustomCategory(false);
            setCustomCategoryName('');
            setStructureJson('');
            setShowAddModal(true);
          }}
          className="gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Thêm Khóa Học Mới
        </Button>
      </div>

      {/* Cấu hình Link Nhóm Cộng Đồng (Zalo & Telegram) */}
      <form
        onSubmit={handleSaveCommunity}
        className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Cài Đặt Link Cộng Đồng (Zalo & Telegram)
            </h2>
            <p className="text-[11px] text-slate-500">
              Hiển thị nút tham gia nhóm cộng đồng ở trang chủ (để trống nếu muốn ẩn kênh đó)
            </p>
          </div>
          {communitySaved && (
            <span className="text-xs font-medium text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <Check className="w-3.5 h-3.5" />
              Đã lưu link cộng đồng!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
              Link nhóm Zalo
            </label>
            <input
              type="text"
              value={zaloUrl}
              onChange={(e) => setZaloUrl(e.target.value)}
              placeholder="https://zalo.me/g/..."
              className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-500" />
              Link nhóm Telegram
            </label>
            <input
              type="text"
              value={telegramUrl}
              onChange={(e) => setTelegramUrl(e.target.value)}
              placeholder="https://t.me/..."
              className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-900 focus:bg-white focus:border-sky-500 outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            disabled={savingCommunity}
            className="gap-1.5 text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5 text-blue-600" />
            {savingCommunity ? 'Đang lưu...' : 'Lưu link cộng đồng'}
          </Button>
        </div>
      </form>

      {/* Course List Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Tên khóa học</th>
                <th className="py-3 px-4">Danh mục</th>
                <th className="py-3 px-4">Số bài học</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Đang tải danh sách...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    Chưa có khóa học nào. Bấm nút "Thêm Khóa Học Mới" ở trên.
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 line-clamp-1">
                        {course.title}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        ID: {course.id.slice(0, 10)}...
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                        {course.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {course.totalLessons ?? 0} bài học
                    </td>
                    <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                      <Link href={`/admin/courses/${course.id}`}>
                        <Button variant="secondary" size="sm" className="h-7 text-xs gap-1 font-semibold">
                          <Edit className="w-3 h-3 text-blue-600" />
                          Quản lý nội dung
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Course Modal with AI Structure Import */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-600" />
                  Thêm Khóa Học Mới
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Điền thông tin và có thể dán cấu trúc JSON tự động tạo từ AI
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-5 text-xs">
              {/* Tên & Danh mục */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Tên khóa học *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    placeholder="Ví dụ: Lập trình Python từ cơ bản đến nâng cao"
                    className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-700 font-semibold">Danh mục *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        if (!isCustomCategory) {
                          setCustomCategoryName('');
                        }
                      }}
                      className="text-[11px] text-blue-600 hover:underline cursor-pointer font-medium"
                    >
                      {isCustomCategory ? '← Chọn danh mục có sẵn' : '+ Tạo danh mục mới'}
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <input
                      type="text"
                      required
                      autoFocus
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      placeholder="Nhập tên danh mục mới (ví dụ: Marketing, AI...)"
                      className="w-full h-9 bg-slate-50 border border-blue-500 rounded-lg px-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                  ) : (
                    <select
                      value={newCourse.category}
                      onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                      className="w-full h-9 bg-slate-50 border border-slate-200 rounded-lg px-2.5 text-slate-900 focus:bg-white focus:border-blue-500 outline-none cursor-pointer transition-all"
                    >
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Box Mẫu Prompt AI */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                    <Bot className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Mẫu Prompt AI Phân Tích Cấu Trúc Khóa Học</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
                  >
                    {copiedPrompt ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Đã sao chép Prompt!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Sao Chép Prompt AI
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowPromptDetails(!showPromptDetails)}
                    className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 transition-colors cursor-pointer font-medium"
                  >
                    {showPromptDetails ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        Thu gọn mẫu câu lệnh Prompt AI
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        Xem nội dung mẫu câu lệnh Prompt AI
                      </>
                    )}
                  </button>

                  {showPromptDetails && (
                    <div className="mt-2.5 p-3 rounded-lg bg-white border border-emerald-200 text-slate-700 font-mono text-[11px] leading-relaxed max-h-48 overflow-y-auto select-all whitespace-pre-wrap shadow-xs">
                      {AI_PROMPT_TEMPLATE}
                    </div>
                  )}
                </div>
              </div>

              {/* Textarea Cấu trúc JSON */}
              <div className="space-y-1.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <label className="text-slate-800 font-semibold text-xs flex items-center gap-1.5">
                    <span>Cấu trúc JSON Khóa Học (Dán kết quả từ AI vào đây):</span>
                  </label>
                  <span className="text-[11px] font-mono text-emerald-700 flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    Chứa tự động Chương, Thư mục & Bài học
                  </span>
                </div>

                <textarea
                  rows={6}
                  value={structureJson}
                  onChange={(e) => handleJsonChange(e.target.value)}
                  placeholder="Dán kết quả JSON do AI tạo vào đây..."
                  className={`w-full font-mono text-xs p-3 rounded-lg bg-slate-50 border transition-colors outline-none resize-y ${
                    jsonAnalysis
                      ? jsonAnalysis.valid
                        ? 'border-emerald-500 bg-emerald-50/30 text-emerald-900 focus:bg-white'
                        : 'border-amber-500 bg-amber-50/30 text-amber-900 focus:bg-white'
                      : 'border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500'
                  }`}
                />

                {/* Validation Status Indicator */}
                {jsonAnalysis && (
                  <div className="pt-0.5">
                    {jsonAnalysis.valid ? (
                      <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-mono font-medium">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          JSON hợp lệ: Tự động nhận diện {jsonAnalysis.chapters} chương,{' '}
                          {(jsonAnalysis.folders || 0) > 0 ? `${jsonAnalysis.folders} thư mục, ` : ''}
                          {jsonAnalysis.lessons} bài học
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-amber-600 font-mono font-medium">
                        {jsonAnalysis.error}
                      </div>
                    )}
                  </div>
                )}
                {!jsonAnalysis && (
                  <p className="text-[11px] text-slate-400">
                    * Nếu để trống, hệ thống sẽ tự động tạo 1 chương và 1 bài học mẫu để bạn chỉnh sửa sau.
                  </p>
                )}
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                >
                  Hủy
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={isSubmitting} className="shadow-xs">
                  {isSubmitting ? 'Đang khởi tạo...' : 'Tạo Khóa Học'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
