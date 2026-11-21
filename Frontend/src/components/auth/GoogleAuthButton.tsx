'use client';

import React from 'react';
import { GoogleLogin, useGoogleOneTapLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/auth';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (err?: any) => void;
  /** standard: nút đầy đủ chữ; icon: chỉ logo G (dùng trên mobile) */
  type?: 'standard' | 'icon';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: number;
}

/**
 * Nút "Đăng nhập bằng Google" chính thức của Google Identity Services.
 * Bấm vào sẽ mở thẳng cửa sổ chọn tài khoản Google (giống mọi website khác),
 * không qua bước trung gian.
 */
export function GoogleAuthButton({
  onSuccess,
  onError,
  type = 'standard',
  size = 'large',
  text = 'signin_with',
  shape = 'pill',
  width,
}: GoogleAuthButtonProps) {
  const { loginWithCredential } = useAuth();

  return (
    <GoogleLogin
      onSuccess={async (credentialResponse) => {
        if (!credentialResponse.credential) return;
        const ok = await loginWithCredential(credentialResponse.credential);
        if (ok) {
          onSuccess?.();
        } else {
          alert('Đăng nhập thất bại. Vui lòng thử lại!');
          onError?.();
        }
      }}
      onError={() => {
        onError?.();
      }}
      type={type}
      theme="outline"
      size={size}
      shape={shape}
      text={text}
      logo_alignment="left"
      width={width}
      useOneTap={false}
    />
  );
}

/**
 * Google One Tap: hộp nhỏ góc phải "Tiếp tục với tên tài khoản" giống các web lớn.
 * Tự đăng nhập lại cho người dùng quay lại (auto_select).
 */
export function GoogleOneTap() {
  const { user, isAuthLoaded, loginWithCredential } = useAuth();

  useGoogleOneTapLogin({
    onSuccess: async (credentialResponse) => {
      if (credentialResponse.credential) {
        await loginWithCredential(credentialResponse.credential);
      }
    },
    onError: () => {},
    auto_select: true,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
    disabled: !isAuthLoaded || Boolean(user),
  });

  return null;
}
