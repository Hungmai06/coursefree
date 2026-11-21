'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { ExternalLink, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth';

interface ShopeePopupConfig {
  shopeePopupEnabled: boolean;
  shopeeUrl: string;
  shopeePopupTitle: string;
  shopeePopupDesc: string;
  shopeeButtonText: string;
}

export const CHECKIN_STORAGE_KEY = 'coursefree_daily_checkin_date';

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function DailyShopeePopup() {
  const pathname = usePathname();
  const { user, isAuthLoaded } = useAuth();
  const [config, setConfig] = useState<ShopeePopupConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const loadConfigAndCheck = useCallback(
    async (forcePreview = false) => {
      if (!isAuthLoaded && !forcePreview) return;

      try {
        const res = await fetch('/api/config/community', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();

        const popupConfig: ShopeePopupConfig = {
          shopeePopupEnabled:
            typeof data.shopeePopupEnabled === 'boolean' ? data.shopeePopupEnabled : true,
          shopeeUrl:
            typeof data.shopeeUrl === 'string' && data.shopeeUrl.trim()
              ? data.shopeeUrl.trim()
              : 'https://shopee.vn/search?keyword=s%C3%A1ch%20ti%E1%BA%BFng%20anh%20cho%20ng%C6%B0%E1%BB%9Di%20b%E1%BA%AFt%20%C4%91%E1%BA%A7u',
          shopeePopupTitle: data.shopeePopupTitle || 'Ủng Hộ Dự Án',
          shopeePopupDesc:
            data.shopeePopupDesc ||
            'Để có thêm kinh phí duy trì máy chủ, vui lòng click ủng hộ chúng tôi tại link dưới đây! Không bắt buộc mua đâu nhé, chỉ cần click xem thôi là đã giúp đỡ Admin rất nhiều rồi ạ!',
          shopeeButtonText:
            data.shopeeButtonText || '📖 Xem Sách Tiếng Anh Cho Người Bắt Đầu',
        };

        setConfig(popupConfig);

        if (forcePreview) {
          setIsOpen(true);
          return;
        }

        // Không tự bật đè lên trang quản trị /admin để Admin dễ chỉnh sửa link
        if (pathname.startsWith('/admin')) {
          return;
        }

        if (!popupConfig.shopeePopupEnabled || !popupConfig.shopeeUrl) {
          setIsOpen(false);
          return;
        }

        const today = getTodayDateString();
        const localCheckedIn = localStorage.getItem(CHECKIN_STORAGE_KEY) === today;

        // 1. Nếu trên Server đã ghi nhận điểm danh hôm nay (từ Điện thoại hoặc thiết bị khác)
        if (data.checkedInToday === true) {
          if (!localCheckedIn) {
            localStorage.setItem(CHECKIN_STORAGE_KEY, today);
            window.dispatchEvent(new Event('daily-checkin-completed'));
          }
          setIsOpen(false);
          return;
        }

        // 2. Nếu thiết bị này đã điểm danh trước khi đăng nhập, tự động đồng bộ lên Server cho tài khoản
        if (localCheckedIn) {
          if (user?.id) {
            fetch('/api/checkin', { method: 'POST' }).catch(() => {});
          }
          setIsOpen(false);
          return;
        }

        // 3. Chưa điểm danh ở cả thiết bị này lẫn thiết bị khác -> Hiển thị Popup
        setIsOpen(true);
      } catch {
        // ignore
      }
    },
    [pathname, isAuthLoaded, user?.id]
  );

  useEffect(() => {
    loadConfigAndCheck(false);
  }, [loadConfigAndCheck]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handlePreview = () => loadConfigAndCheck(true);
    const handleConfigUpdated = () => loadConfigAndCheck(false);

    window.addEventListener('preview-shopee-popup', handlePreview);
    window.addEventListener('community-config-updated', handleConfigUpdated);
    return () => {
      window.removeEventListener('preview-shopee-popup', handlePreview);
      window.removeEventListener('community-config-updated', handleConfigUpdated);
    };
  }, [loadConfigAndCheck]);

  if (!isOpen || !config) return null;

  const handleClickShopee = () => {
    const today = getTodayDateString();
    localStorage.setItem(CHECKIN_STORAGE_KEY, today);
    window.dispatchEvent(new Event('daily-checkin-completed'));
    // Đồng bộ trạng thái đã điểm danh lên Server để thiết bị khác (ĐT / Máy tính) không cần điểm danh lại
    fetch('/api/checkin', { method: 'POST' }).catch(() => {});
    window.open(config.shopeeUrl, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="bg-white rounded-[28px] w-full max-w-[460px] px-6 py-7 sm:px-8 sm:py-8 shadow-2xl border border-slate-100 text-center space-y-4 animate-in zoom-in-95 duration-150">
        {/* Badge Điểm Danh Hàng Ngày */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/80 text-[#EE4D2D] text-[11px] font-bold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Điểm Danh Mở Khóa Học Hôm Nay</span>
        </div>

        {/* Icon Trái Tim 3D */}
        <div className="flex justify-center pt-1">
          <div className="w-14 h-14 flex items-center justify-center drop-shadow-[0_8px_16px_rgba(244,63,94,0.35)]">
            <svg viewBox="0 0 64 64" className="w-13 h-13">
              <defs>
                <radialGradient id="heart3d" cx="35%" cy="28%" r="70%">
                  <stop offset="0%" stopColor="#ff758f" />
                  <stop offset="45%" stopColor="#f43f5e" />
                  <stop offset="100%" stopColor="#be123c" />
                </radialGradient>
              </defs>
              <path
                fill="url(#heart3d)"
                d="M32 56.6c-1.1 0-2.2-.4-3.1-1.2C17.4 45.7 6 35.1 6 21.9 6 13.1 12.9 6 21.6 6c4.2 0 8.1 1.7 10.4 4.7C34.3 7.7 38.2 6 42.4 6 51.1 6 58 13.1 58 21.9c0 13.2-11.4 23.8-22.9 33.5-.9.8-2 1.2-3.1 1.2z"
              />
              <ellipse
                cx="21"
                cy="17"
                rx="6"
                ry="3.5"
                transform="rotate(-25 21 17)"
                fill="rgba(255,255,255,0.45)"
              />
            </svg>
          </div>
        </div>

        {/* Tiêu đề & Mô tả */}
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight">
            {config.shopeePopupTitle}
          </h2>
          <p className="text-[13px] sm:text-[13.5px] text-slate-500 leading-relaxed max-w-sm mx-auto">
            {config.shopeePopupDesc}
          </p>
        </div>

        {/* Hộp Hướng Dẫn Chi Tiết Trực Quan */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-left space-y-2.5 text-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Hướng dẫn điểm danh mở khóa (Chỉ mất 1 giây):
          </div>

          {/* Bước 1 */}
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-orange-50/90 border border-orange-200 text-slate-900">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 bg-[#EE4D2D] text-white animate-pulse">
              1
            </span>
            <div className="leading-snug">
              <span className="font-bold">Bước 1: </span>
              <span>
                Bấm vào <strong>nút màu cam bên dưới</strong> để mở xem link sách trên Shopee{' '}
                <span className="text-slate-500">(chỉ cần mở xem, không cần mua)</span>.
              </span>
            </div>
          </div>

          {/* Bước 2 */}
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-white border border-slate-200/60 text-slate-600">
            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 bg-emerald-600 text-white">
              2
            </span>
            <div className="leading-snug">
              <span className="font-bold text-slate-900">Bước 2: </span>
              <span>
                Ngay sau khi bấm, <strong>Popup sẽ tự động tắt</strong> và đồng bộ trạng thái đã điểm danh trên mọi thiết bị của bạn trong ngày hôm nay!
              </span>
            </div>
          </div>
        </div>

        {/* Nút bấm mở link Shopee & tự động tắt Popup */}
        <div className="pt-1">
          <div className="relative">
            <span className="absolute -top-2.5 right-3 z-10 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px] shadow-xs animate-bounce">
              👆 Bấm vào đây để mở khóa
            </span>
            <button
              type="button"
              onClick={handleClickShopee}
              className="w-full py-3.5 px-5 rounded-2xl bg-[#EE4D2D] hover:bg-[#df4222] active:translate-y-[2px] text-white font-bold text-sm sm:text-[15px] shadow-[0_4px_0_#b53015] active:shadow-[0_2px_0_#b53015] ring-4 ring-orange-200 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{config.shopeeButtonText}</span>
              <ExternalLink className="w-4 h-4 shrink-0 opacity-90" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
