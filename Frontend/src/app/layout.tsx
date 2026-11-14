import type { Metadata } from 'next';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: 'CourseFree — Nền Tảng Học Trực Tuyến Tối Giản',
  description: 'Học lập trình, ngoại ngữ, thiết kế giao diện với cấu trúc khóa học tinh gọn và hiện đại.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#F8FAFC] text-slate-900 min-h-screen selection:bg-blue-100 selection:text-blue-900 antialiased">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
