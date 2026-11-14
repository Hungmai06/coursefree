'use client';

import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/lib/auth';

interface GoogleAuthButtonProps {
  onSuccess?: () => void;
  onError?: (err?: any) => void;
}

export function GoogleAuthButton({ onSuccess, onError }: GoogleAuthButtonProps) {
  const { loginWithCredential } = useAuth();

  return (
    <div className="flex justify-center w-full my-2">
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          if (credentialResponse.credential) {
            const ok = await loginWithCredential(credentialResponse.credential);
            if (ok) {
              onSuccess?.();
            } else {
              alert('Đăng nhập thất bại. Vui lòng thử lại!');
              onError?.();
            }
          }
        }}
        onError={() => {
          alert('Không thể kết nối đến tài khoản Google. Vui lòng kiểm tra lại cấu hình Client ID và Authorized Origins.');
          onError?.();
        }}
        useOneTap={false}
        theme="outline"
        size="large"
        shape="rectangular"
        text="signin_with"
      />
    </div>
  );
}
