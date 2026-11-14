'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserCheck, MessageCircleHeart, ArrowUpRight, Sparkles, Send, MessageSquare } from 'lucide-react';

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Thống kê số người đăng ký & vào học */}
      <div className="lg:col-span-5 grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:border-blue-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 truncate">
              Tổng người đăng ký
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                {stats ? stats.totalUsers.toLocaleString('vi-VN') : '—'}
              </span>
              <span className="text-[10px] font-mono text-blue-600 font-semibold">
                thành viên
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3.5 hover:border-emerald-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0 relative">
            <UserCheck className="w-5 h-5" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-slate-500 truncate">
              Đã tham gia học
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-lg sm:text-xl font-bold text-slate-900 tabular-nums">
                {stats ? stats.activeLearners.toLocaleString('vi-VN') : '—'}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold">
                học viên
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Kêu gọi tham gia Nhóm Cộng Đồng Zalo & Telegram */}
      <div className="lg:col-span-7 bg-gradient-to-r from-blue-50 via-indigo-50/70 to-white border border-blue-200/80 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <MessageCircleHeart className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                {communityTitle}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-600 text-white">
                <Sparkles className="w-2.5 h-2.5" />
                CẬP NHẬT HÀNG NGÀY
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-snug">
              Tham gia nhóm để nhận khóa học mới và tài liệu chia sẻ miễn phí mỗi ngày.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {zaloUrl && (
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.02]"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Zalo</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}

          {telegramUrl && (
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all hover:scale-[1.02]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telegram</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
