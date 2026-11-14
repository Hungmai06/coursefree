# COURSEFREE — Premium Video Learning Platform

Dự án được cấu trúc tách biệt hoàn toàn thành 2 phần độc lập: **Backend** (REST API Server) và **Frontend** (Next.js App Router).

```
CourseFree/
├── Backend/                 # Máy chủ REST API & Cơ sở dữ liệu
│   ├── prisma/             # Schema Prisma, SQLite & Seed data
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── dev.db
│   ├── src/
│   │   ├── lib/            # Prisma client, Tree builder, AI Parser
│   │   └── server.ts       # Express server (CORS, REST routes)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env                # PORT=5000, DATABASE_URL
│
└── Frontend/                # Giao diện người dùng Next.js 14 Dark Premium
    ├── src/
    │   ├── app/            # App Router (Dashboard, Courses, Watch, Parser, Admin...)
    │   ├── components/     # UI primitives, Video Player, Curriculum Tree, Tree Editor
    │   └── lib/            # API client, utility functions, type definitions
    ├── package.json
    ├── tailwind.config.ts  # Design tokens Dark Premium (#09090B, #A78BFA...)
    ├── tsconfig.json
    └── next.config.mjs     # Rewrites tự động proxy /api sang Backend:5000
```

---

## ✦ Khởi động dự án

### 1. Khởi động Backend (Port 5000)
```bash
cd Backend
npm install
npm run db:push
npm run db:seed
npm run dev
```
Máy chủ API chạy tại: **http://localhost:5000**
Kiểm tra sức khỏe hệ thống: `http://localhost:5000/api/health`

### 2. Khởi động Frontend (Port 3000)
```bash
cd Frontend
npm install
npm run dev
```
Trang web người dùng chạy tại: **http://localhost:3000**

---

## ✦ Tính năng chính
1. **Design System Dark Premium**: Gam màu tối chuẩn mực `#09090B`, accent `#A78BFA`, font Geist / Inter, spacing 4px grid.
2. **Dashboard**: Thẻ Continue Learning bài học gần nhất, 4 thông số học tập thực tế từ Database, danh sách khóa học mới dạng grid 3 cột.
3. **All Courses**: Tìm kiếm, lọc category, sắp xếp, chuyển đổi Grid/List view, modal tạo khóa học & import JSON.
4. **Course Details**: Bố cục 2 cột, cây thư mục giáo trình vô hạn cấp độ (Chapter, Folder, Lesson) với trạng thái hoàn thành, đang học và chưa học.
5. **Video Player Studio**: Trình phát 16:9 hỗ trợ cả HTML5 MP4, YouTube, Vimeo; phím tắt bàn phím (Space, M, F, Mũi tên seek), lưu giây xem dở (resume playback), ghi chú có gắn timestamp có thể click để nhảy video, sidebar giáo trình 320px scroll độc lập.
6. **AI Course Structure Parser**: Công cụ phân tích outline thô / Markdown / link video thành JSON schema đệ quy và import thẳng vào database.
7. **Admin Course Studio**: Quản lý khóa học, cây thư mục kéo đẩy thêm sửa xóa bài học và link video.
