'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Search,
  Sliders,
  LogOut,
  CheckCircle2,
  Gift,
  ChevronDown,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { GoogleAuthButton, GoogleOneTap } from '../auth/GoogleAuthButton';
import { CHECKIN_STORAGE_KEY, getTodayDateString } from './DailyShopeePopup';

function UserAvatar({ name, image, size = 28 }: { name: string; image?: string; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initial = (name || '?').trim().charAt(0).toUpperCase();

  if (!image || broken) {
    return (
      <span
        style={{ width: size, height: size }}
        className="rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0"
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      src={image}
      alt={name}
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      style={{ width: size, height: size }}
      className="rounded-full border border-slate-200 object-cover shrink-0"
    />
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isGoogleConfigured, isAuthLoaded } = useAuth();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkStatus = () => {
      const today = getTodayDateString();
      setIsCheckedInToday(localStorage.getItem(CHECKIN_STORAGE_KEY) === today);
    };
    checkStatus();
    window.addEventListener('daily-checkin-completed', checkStatus);
    return () => window.removeEventListener('daily-checkin-completed', checkStatus);
  }, [pathname]);

  // Đóng menu tài khoản khi bấm ra ngoài
  useEffect(() => {
    if (!showUserDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showUserDropdown]);

  return (
    <>
      {/* Google One Tap: tự gợi ý "Tiếp tục với tài khoản Google" cho người chưa đăng nhập */}
      {isGoogleConfigured && <GoogleOneTap />}

      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between select-none shadow-xs">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900">
              Course<span className="text-blue-600">Free</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-xs font-medium">
            <Link
              href="/"
              className={`hidden md:inline-flex px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/' || pathname.startsWith('/courses')
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Trang chủ
            </Link>

            <Link
              href="/community"
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/community')
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Cộng đồng</span>
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  pathname.startsWith('/admin')
                    ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Quản trị Admin
              </Link>
            )}
          </nav>
        </div>

        {/* Center: Search */}
        <div className="hidden lg:block flex-1 max-w-xs mx-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                window.location.href = `/courses?search=${encodeURIComponent(searchQuery)}`;
              }
            }}
            className="relative"
          >
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm khóa học..."
              className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
            />
          </form>
        </div>

        {/* Right: Daily Check-in + Google Login / User Avatar */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('preview-shopee-popup'))}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
              isCheckedInToday
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-orange-50 text-[#EE4D2D] border-orange-200 hover:bg-orange-100 animate-pulse'
            }`}
            title="Điểm danh ủng hộ dự án mỗi ngày"
          >
            {isCheckedInToday ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">Đã điểm danh hôm nay</span>
              </>
            ) : (
              <>
                <Gift className="w-3.5 h-3.5 text-[#EE4D2D] shrink-0" />
                <span className="hidden sm:inline">Điểm danh hôm nay</span>
              </>
            )}
          </button>

          {!isAuthLoaded ? (
            <div className="w-24 h-8 rounded-full bg-slate-100 animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <UserAvatar name={user.name} image={user.image} />
                <span className="text-xs font-medium text-slate-700 hidden sm:inline max-w-[120px] truncate">
                  {user.name}
                </span>
                {user.role === 'admin' && (
                  <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                    Admin
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-2 border-b border-slate-100 mb-1 flex items-center gap-2.5">
                    <UserAvatar name={user.name} image={user.image} size={36} />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors font-medium"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      Trang Quản trị Admin
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : isGoogleConfigured ? (
            <>
              {/* Nút Google chính thức: bấm là mở ngay cửa sổ chọn tài khoản Google */}
              <div className="hidden sm:block">
                <GoogleAuthButton size="medium" text="signin_with" shape="pill" />
              </div>
              <div className="sm:hidden">
                <GoogleAuthButton type="icon" size="medium" shape="circle" />
              </div>
            </>
          ) : (
            <span
              className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg"
              title="Thiếu NEXT_PUBLIC_GOOGLE_CLIENT_ID trong Frontend/.env"
            >
              Chưa cấu hình Google Login
            </span>
          )}
        </div>
      </header>
    </>
  );
}
