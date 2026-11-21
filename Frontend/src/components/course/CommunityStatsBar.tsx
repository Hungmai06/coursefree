'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserCheck, ArrowUpRight, Send, MessageCircle } from 'lucide-react';

interface StatsData {
  totalUsers: number;
  activeLearners: number;
  totalCourses: number;
  totalLessons: number;
  zaloUrl?: string;
  telegramUrl?: string;
  communityTitle?: string;
}

export function CommunityStatsBar() {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setStats(data);
      })
      .catch(() => {});
  }, []);

  const zaloUrl = stats?.zaloUrl?.trim() || '';
  const telegramUrl = stats?.telegramUrl?.trim() || '';
  const communityTitle = stats?.communityTitle || 'Nhóm Cộng Đồng Share Khóa Học';
  const hasCommunity = Boolean(zaloUrl || telegramUrl);

  return (
    <div className="space-y-4">
      {/* Banner Nhóm Cộng Đồng — tương phản cao, gọn gàng */}
      {hasCommunity && (
        <div className="rounded-2xl bg-slate-900 text-white px-5 py-5 sm:px-6 sm:py-5 border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                Cộng đồng học tập
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              {communityTitle}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Vào nhóm để nhận khóa học mới, tải tài liệu miễn phí và hỏi đáp trực tiếp cùng Admin.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
            {zaloUrl && (
              <a
                href={zaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#0068FF] hover:bg-[#0056d6] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                <span>Vào nhóm Zalo</span>
                <ArrowUpRight className="w-4 h-4 shrink-0 opacity-80" />
              </a>
            )}

            {telegramUrl && (
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-[#229ED9] hover:bg-[#1b8cc2] text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span>Vào nhóm Telegram</span>
                <ArrowUpRight className="w-4 h-4 shrink-0 opacity-80" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Thống kê */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 truncate">Tổng người đăng ký</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                {stats ? stats.totalUsers.toLocaleString('vi-VN') : '—'}
              </span>
              <span className="text-[11px] text-slate-500">thành viên</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:border-slate-300 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 truncate">Đã tham gia học</p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                {stats ? stats.activeLearners.toLocaleString('vi-VN') : '—'}
              </span>
              <span className="text-[11px] text-slate-500">học viên</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Thẻ nhỏ "Nhóm cộng đồng" gắn ở Sidebar */
export function CommunitySidebarCard() {
  const [links, setLinks] = useState<{ zaloUrl: string; telegramUrl: string } | null>(null);

  useEffect(() => {
    fetch('/api/config/community', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setLinks({
            zaloUrl: (data.zaloUrl || '').trim(),
            telegramUrl: (data.telegramUrl || '').trim(),
          });
        }
      })
      .catch(() => {});
  }, []);

  if (!links || (!links.zaloUrl && !links.telegramUrl)) return null;

  return (
    <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 space-y-2.5">
      <div className="space-y-0.5">
        <p className="text-xs font-bold text-slate-900">Nhóm cộng đồng</p>
        <p className="text-[11px] text-slate-500 leading-snug">
          Nhận khóa học & tài liệu mới mỗi ngày
        </p>
      </div>
      <div className="space-y-1.5">
        {links.zaloUrl && (
          <a
            href={links.zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-2.5 py-1.5 rounded-lg bg-[#0068FF] hover:bg-[#0056d6] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Nhóm Zalo
          </a>
        )}
        {links.telegramUrl && (
          <a
            href={links.telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-2.5 py-1.5 rounded-lg bg-[#229ED9] hover:bg-[#1b8cc2] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            Nhóm Telegram
          </a>
        )}
      </div>
    </div>
  );
}
