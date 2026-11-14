'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  Search,
  Sliders,
  LogOut,
  X,
  AlertCircle,
  CheckCircle2,
  Gift,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button } from '../ui/Button';
import { GoogleAuthButton } from '../auth/GoogleAuthButton';
import { CHECKIN_STORAGE_KEY, getTodayDateString } from './DailyShopeePopup';

export function Header() {
  const pathname = usePathname();
  const { user, logout, isAdmin, isGoogleConfigured } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckedInToday, setIsCheckedInToday] = useState(false);

  useEffect(() => {
    const checkStatus = () => {
      const today = getTodayDateString();
      setIsCheckedInToday(localStorage.getItem(CHECKIN_STORAGE_KEY) === today);
    };
    checkStatus();
    window.addEventListener('daily-checkin-completed', checkStatus);
    return () => window.removeEventListener('daily-checkin-completed', checkStatus);
  }, [pathname]);

  return (
    <>
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

          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                pathname === '/' || pathname.startsWith('/courses')
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Trang chủ
            </Link>

            {isAdmin && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
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

        {/* Right: Daily Check-in + Google Login Button or User Avatar */}
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

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <img
                  src={user.image}
                  alt={user.name}
                  className="w-7 h-7 rounded-full border border-slate-200 object-cover"
                />
                <span className="text-xs font-medium text-slate-700 hidden sm:inline">
                  {user.name}
                </span>
                {user.role === 'admin' && (
                  <span className="text-[10px] font-mono uppercase bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200 font-semibold">
                    Admin
                  </span>
                )}
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-2 py-1.5 border-b border-slate-100 mb-1">
                    <p className="font-semibold text-slate-900">{user.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
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
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowLoginModal(true)}
              className="gap-2 text-xs"
            >
              {/* Google SVG Logo */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Đăng nhập Google</span>
            </Button>
          )}
        </div>
      </header>

      {/* Google Login Modal Chuẩn */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-900">Đăng Nhập Google</h2>
              <p className="text-xs text-slate-500 mt-1">
                Đăng nhập để lưu lại tiến độ bài học và nhật ký học tập của bạn
              </p>
            </div>

            {/* Nút đăng nhập Google chính thức */}
            <div className="space-y-4">
              {isGoogleConfigured ? (
                <div className="py-2 flex justify-center">
                  <GoogleAuthButton
                    onSuccess={() => setShowLoginModal(false)}
                    onError={() => {}}
                  />
                </div>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[11px] leading-relaxed">
                    Chưa tìm thấy <strong>NEXT_PUBLIC_GOOGLE_CLIENT_ID</strong> trong file <code className="bg-amber-100 px-1 rounded">Frontend/.env.local</code>. Hãy điền Client ID vào file .env để bật đăng nhập.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
