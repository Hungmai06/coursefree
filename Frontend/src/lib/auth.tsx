'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { GoogleOAuthProvider, googleLogout } from '@react-oauth/google';

export const ADMIN_EMAIL = 'maivanhung0604@gmail.com';
const TOKEN_KEY = 'coursefree_token';

if (typeof window !== 'undefined' && !(window as any).__cfFetchPatched) {
  (window as any).__cfFetchPatched = true;
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
    const token = localStorage.getItem(TOKEN_KEY);
    if (token && url.startsWith('/api/')) {
      const headers = new Headers(init?.headers || (typeof input !== 'string' && !(input instanceof URL) ? input.headers : undefined));
      headers.set('Authorization', 'Bearer ' + token);
      init = { ...init, headers };
    }
    const res = await originalFetch(input, init);
    if (res.status === 401 && token && url.startsWith('/api/')) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('coursefree_user');
    }
    return res;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthLoaded: boolean;
  googleClientId: string;
  isGoogleConfigured: boolean;
  loginWithCredential: (credential: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthLoaded: false,
  googleClientId: '',
  isGoogleConfigured: false,
  loginWithCredential: async () => false,
  logout: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();

  // Tải thông tin người dùng từ LocalStorage khi khởi tạo
  useEffect(() => {
    const saved = localStorage.getItem('coursefree_user');
    if (saved && !localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem('coursefree_user');
    } else if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const normalized = String(parsed.email || '').trim().toLowerCase();
        parsed.role = normalized === ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';
        setUser(parsed);
      } catch (e) {
        localStorage.removeItem('coursefree_user');
      }
    }
    setIsAuthLoaded(true);
  }, []);

  // Đăng nhập bằng Google ID Token thật (từ component <GoogleLogin />)
  const loginWithCredential = async (credential: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (res.ok) {
        const data = await res.json();
        const isAdminEmail = String(data.user.email).toLowerCase() === ADMIN_EMAIL.toLowerCase();
        const loggedUser: AuthUser = {
          ...data.user,
          role: isAdminEmail ? 'admin' : 'user',
        };
        setUser(loggedUser);
        localStorage.setItem('coursefree_user', JSON.stringify(loggedUser));
        if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const logout = () => {
    try {
      // Tắt tự động đăng nhập One Tap sau khi người dùng chủ động đăng xuất
      googleLogout();
    } catch {}
    setUser(null);
    localStorage.removeItem('coursefree_user');
    localStorage.removeItem(TOKEN_KEY);
  };

  const isConfigured = Boolean(googleClientId && googleClientId.length > 5);

  const contextValue: AuthContextType = {
    user,
    isAuthLoaded,
    googleClientId,
    isGoogleConfigured: isConfigured,
    loginWithCredential,
    logout,
    isAdmin: user?.role === 'admin' && String(user?.email).toLowerCase() === ADMIN_EMAIL.toLowerCase(),
  };

  if (isConfigured) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        <AuthContext.Provider value={contextValue}>
          {children}
        </AuthContext.Provider>
      </GoogleOAuthProvider>
    );
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
