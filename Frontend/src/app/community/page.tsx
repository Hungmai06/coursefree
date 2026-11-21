'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Send,
  MessageCircle,
  Copy,
  Check,
  ArrowUpRight,
  Users,
  Share2,
  Sliders,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface CommunityConfig {
  communityTitle: string;
  telegramUrl: string;
  zaloUrl: string;
}

export default function CommunityPage() {
  const { isAdmin } = useAuth();
  const [config, setConfig] = useState<CommunityConfig>({
    communityTitle: 'Nhóm Cộng Đồng Share Khóa Học',
    telegramUrl: '',
    zaloUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [pageUrl, setPageUrl] = useState('https://khoahocfree.online/community');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPageUrl(`${window.location.origin}/community`);
    }
    fetch('/api/config/community', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setConfig({
            communityTitle: data.communityTitle || 'Nhóm Cộng Đồng Share Khóa Học',
            telegramUrl: (data.telegramUrl || '').trim(),
            zaloUrl: (data.zaloUrl || '').trim(),
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const copyText = async (text: string, key: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleCopyAll = () => {
    const lines: string[] = [
      `Tham gia ${config.communityTitle} (Miễn phí):`,
    ];
    if (config.telegramUrl) {
      lines.push(`- Nhóm Telegram (Ưu tiên): ${config.telegramUrl}`);
    }
    if (config.zaloUrl) {
      lines.push(`- Nhóm Zalo: ${config.zaloUrl}`);
    }
    lines.push(`- Trang cộng đồng: ${pageUrl}`);
    copyText(lines.join('\n'), 'all');
  };

  const hasAnyLink = Boolean(config.telegramUrl || config.zaloUrl);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-blue-600">
            <Users className="w-4 h-4" />
            <span>Cộng đồng học tập</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {config.communityTitle}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Cập nhật khóa học mới, tài liệu miễn phí và hỗ trợ học tập mỗi ngày.
          </p>
        </div>

        {isAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 shrink-0 self-start sm:self-center"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            Sửa link nhóm
          </Link>
        )}
      </div>

      {/* Thanh Copy nhanh link trang Cộng đồng để gửi cho người dùng */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-slate-500" />
            Link trang cộng đồng để chia sẻ nhanh
          </span>
          {hasAnyLink && (
            <button
              type="button"
              onClick={handleCopyAll}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Đã copy tin nhắn kèm đủ link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy tin nhắn kèm cả 2 link</span>
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={pageUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 outline-none"
          />
          <button
            type="button"
            onClick={() => copyText(pageUrl, 'page')}
            className={`h-9 px-3.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
              copiedKey === 'page'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {copiedKey === 'page' ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đã copy</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Danh sách 2 kênh cộng đồng: Ưu tiên Telegram trên, Zalo dưới */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Đang tải thông tin nhóm cộng đồng...
        </div>
      ) : !hasAnyLink ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm font-semibold text-slate-800">
            Chưa cấu hình link nhóm cộng đồng
          </p>
          <p className="text-xs text-slate-500">
            Admin có thể vào trang Quản trị để thêm link Telegram và Zalo.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 1. TELEGRAM (ƯU TIÊN SỐ 1) */}
          {config.telegramUrl && (
            <div className="bg-white border-2 border-[#229ED9]/30 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-slate-900">
                        Nhóm Telegram
                      </h2>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-sky-50 text-[#229ED9] border border-sky-200">
                        Ưu tiên tham gia
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Kênh chính cập nhật nhanh nhất, không bị trôi tin nhắn, lưu trữ đầy đủ link khóa học cũ và mới.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={config.telegramUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyText(config.telegramUrl, 'telegram')}
                  className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border shrink-0 transition-colors cursor-pointer ${
                    copiedKey === 'telegram'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {copiedKey === 'telegram' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã copy</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <a
                href={config.telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#229ED9] hover:bg-[#1b8cc2] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Tham gia nhóm Telegram ngay</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* 2. ZALO */}
          {config.zaloUrl && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-[#0068FF] text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <h2 className="text-base font-bold text-slate-900">
                      Nhóm Zalo
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Trao đổi, hỏi đáp nhanh trực tiếp trên Zalo cùng cộng đồng học viên.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={config.zaloUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyText(config.zaloUrl, 'zalo')}
                  className={`h-9 px-3 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 border shrink-0 transition-colors cursor-pointer ${
                    copiedKey === 'zalo'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {copiedKey === 'zalo' ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Đã copy</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <a
                href={config.zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#0068FF] hover:bg-[#0056d6] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Tham gia nhóm Zalo</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
