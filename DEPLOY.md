# 🚀 Hướng Dẫn Đóng Gói & Deploy Máy Chủ (Git & Docker)

Tài liệu này hướng dẫn chi tiết từng bước để đẩy mã nguồn dự án **CourseFree (Nền Tảng Chia Sẻ Khóa Học Miễn Phí)** lên Git và triển khai tự động bằng Docker & Docker Compose trên máy chủ VPS cho tên miền **`khoahocfree.online`**.

---

## 🛠️ Kiến Trúc Hệ Thống Trong Docker (3 Service)

Dự án đã được đóng gói thành **3 Container Docker** kết nối qua mạng nội bộ (`coursefree_net`):
1. **Database Container (`coursefree_mysql`)**: Chạy cơ sở dữ liệu **MySQL 8.0** độc lập. Toàn bộ dữ liệu tài khoản học viên, khóa học, cây bài học và tiến độ học tập được lưu trữ bền vững vào Docker Volume (`mysql_data`).
2. **Backend Container (`coursefree_backend`)**: Chạy Node.js Express + Prisma API (Cổng `5000`), kết nối trực tiếp với MySQL Container (`db:3306`) thông qua cơ chế `service_healthy`, tự động đồng bộ bảng (`prisma db push`) và khởi tạo dữ liệu mẫu lần đầu (`seed.js --if-empty`). Cấu hình nhóm cộng đồng Zalo/Telegram được lưu bền vững vào Volume (`backend_data`).
3. **Frontend Container (`coursefree_frontend`)**: Chạy Next.js 14 Production Server (Cổng `3000`), phục vụ tên miền **`khoahocfree.online`** và tự động Reverse Proxy tất cả yêu cầu `/api/` về Backend (`http://backend:5000`).

---

## 📝 BƯỚC 1: Đẩy Mã Nguồn Lên Git (Máy Local)

Thực hiện các lệnh sau trên máy tính cá nhân của bạn để đẩy mã nguồn lên GitHub:

```bash
git add .
git commit -m "Update MySQL docker container & domain khoahocfree.online"
git push origin main
```

---

## 💻 BƯỚC 2: Chuẩn Bị Máy Chủ VPS (Server Linux)

Đăng nhập vào VPS qua SSH:
```bash
ssh root@161.248.4.83
```

### 2.1 Cài đặt Docker & Docker Compose Plugin (Ubuntu/Debian):
```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài đặt Docker Compose Plugin
sudo apt install -y docker-compose-plugin

# Kiểm tra cài đặt
docker --version
docker compose version
```

---

## 📥 BƯỚC 3: Tải Mã Nguồn Về Server & Cấu Hình

### 3.1 Clone kho lưu trữ Git về VPS:
```bash
cd /var/www/
git clone https://github.com/Hungmai06/coursefree.git coursefree
cd coursefree
```

### 3.2 Kiểm tra file `docker-compose.yml`:
Có thể tùy chỉnh lại Mật khẩu MySQL, `GOOGLE_CLIENT_ID` hoặc `SESSION_SECRET` trong `docker-compose.yml`:
```bash
nano docker-compose.yml
```

---

## 🚀 BƯỚC 4: Khởi Chạy Hệ Thống (3 Containers)

Thực hiện lệnh sau trên VPS để tự động build và bật 3 Container (`MySQL`, `Backend`, `Frontend`):

```bash
docker compose up -d --build
```

> ⚡ **Kết quả mong đợi:**
> - MySQL 8.0 (`coursefree_mysql`) khởi chạy và tự động khởi tạo Database `coursefree`.
> - Node.js Backend (`coursefree_backend`) đợi MySQL sẵn sàng (`service_healthy`) rồi tự động chạy `prisma db push` & Seed dữ liệu khóa học mẫu (nếu DB trống).
> - Frontend Next.js (`coursefree_frontend`) sẵn sàng đón nhận truy cập tại cổng `3000` cho tên miền **`khoahocfree.online`**.

> 💡 **Mẹo xử lý nếu VPS thiếu RAM khi build (Lỗi exit code 1 / OOM):**
> Nếu VPS có RAM 1GB - 2GB, hãy tạo bộ nhớ ảo (Swap) trước khi build để tránh bị tràn RAM khi build Next.js:
> ```bash
> sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
> echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
> ```

---

## 🔍 BƯỚC 5: Kiểm Tra Trạng Thái & Nhật Ký Server

### 5.1 Kiểm tra các container đang hoạt động:
```bash
docker compose ps
```

### 5.2 Xem log các service:
```bash
# Log tất cả các service
docker compose logs -f

# Log riêng Backend
docker compose logs -f backend

# Log riêng MySQL Database
docker compose logs -f db

# Log riêng Frontend Next.js
docker compose logs -f frontend
```

> 🛠️ **Nếu bị lỗi `container coursefree_mysql is unhealthy` (hoặc `Fatal glibc error: CPU does not support x86-64-v2`):**
> 1. Trên một số VPS ảo hóa KVM/QEMU, CPU ảo không bật tập lệnh `x86-64-v2` khiến image `mysql:8.0` (Oracle Linux 9) báo lỗi `Fatal glibc error: CPU does not support x86-64-v2`. Dự án đã dùng **`mysql:8.0-debian`** trong `docker-compose.yml` để tương thích 100% với mọi CPU VPS.
> 2. Nếu đổi từ `mysql:8.0` sang `mysql:8.0-debian`, chạy lệnh sau để xóa volume lỗi và khởi động lại ngay:
>    ```bash
>    sed -i 's/image: mysql:8.0$/image: mysql:8.0-debian/g' docker-compose.yml
>    docker compose down -v
>    docker compose up -d
>    ```

---

## 🔒 BƯỚC 6: Cấu Hình Nginx Host & SSL HTTPS Cho Tên Miền `khoahocfree.online`

Vì VPS đang chạy các dịch vụ web khác trên cổng 80 (và 8080), Frontend Docker của CourseFree được cấu hình chạy tại cổng **3000** (`http://127.0.0.1:3000`).

### 6.1 Tạo file cấu hình Nginx Reverse Proxy trên VPS:
```bash
sudo nano /etc/nginx/sites-available/coursefree
```
Dán nội dung sau vào:
```nginx
server {
    server_name khoahocfree.online www.khoahocfree.online;

    client_max_body_size 10M;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;
    gzip_min_length 256;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Hỗ trợ WebSocket & Next.js tối ưu hiệu năng
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_buffers 8 16k;
        proxy_buffer_size 32k;
    }
}
```
Kích hoạt config và reload Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/coursefree /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.2 Trỏ tên miền DNS về IP VPS & Cài đặt SSL HTTPS miễn phí với Certbot:

Trước khi chạy Certbot, vào trang quản trị tên miền **`khoahocfree.online`** (Tenten, Nhân Hòa, Matbao, Namecheap, Cloudflare...) và tạo **2 bản ghi DNS**:

| Loại (Type) | Tên (Host / Name) | Giá trị (Value / IPv4) | TTL / Proxy |
| :--- | :--- | :--- | :--- |
| **A** | `@` | `161.248.4.83` *(hoặc IP VPS của bạn)* | Auto / Tắt đám mây cam (DNS Only) khi đang lấy SSL |
| **A** | `www` | `161.248.4.83` *(hoặc IP VPS của bạn)* | Auto / Tắt đám mây cam (DNS Only) khi đang lấy SSL |

Kiểm tra trên VPS xem tên miền đã nhận IP chưa (chờ ~1–5 phút sau khi lưu DNS):
```bash
ping -c 2 khoahocfree.online
```

Khi đã trả về đúng IP VPS, chạy lệnh lấy chứng chỉ SSL HTTPS:
```bash
sudo certbot --nginx -d khoahocfree.online -d www.khoahocfree.online
```

---

## 🔄 BƯỚC 7: Cập Nhật Phiên Bản Mới Khi Đẩy Code Lên Git

Mỗi khi bạn đẩy code mới lên GitHub (`git push origin main`), chạy 3 lệnh sau trên VPS để cập nhật **không bị mất dữ liệu**:

```bash
cd /var/www/coursefree /// cd ~/coursefree
git pull origin main
docker compose up -d --build
```

---

## 🗄️ BƯỚC 8: Quản Lý Dữ Liệu MySQL

- **Sao lưu Database MySQL**:
  ```bash
  docker exec coursefree_mysql mysqldump -u root -proot_secure_password_123 coursefree > backup_coursefree.sql
  ```
- **Khôi phục Database MySQL**:
  ```bash
  docker exec -i coursefree_mysql mysql -u root -proot_secure_password_123 coursefree < backup_coursefree.sql
  ```

---

## 🔑 BƯỚC 9: Cấu Hình Đăng Nhập Bằng Google (Google OAuth Trực Tiếp - Không cần Supabase)

Hệ thống đã tích hợp trực tiếp **Google Identity Services** qua thư viện `@react-oauth/google` (Frontend Next.js) và `google-auth-library` (Backend Node.js + Prisma MySQL):

### 1. Tạo / Cập nhật Google OAuth Client ID (Mất ~2 phút)
1. Truy cập [Google Cloud Console](https://console.cloud.google.com/).
2. Chọn Project của bạn (hoặc tạo Project mới).
3. Vào **APIs & Services ➔ OAuth consent screen**:
   - Chọn **External** ➔ Bấm **Create**.
   - Điền **App name** (VD: *CourseFree*), chọn email hỗ trợ và điền email liên hệ của bạn.
   - Các bước tiếp theo (Scopes, Test Users) có thể bấm **Save and Continue** (mặc định lấy `email`, `profile`, `openid`).
4. Vào **APIs & Services ➔ Credentials**:
   - Bấm **Create Credentials ➔ OAuth client ID** (hoặc chỉnh sửa Client ID hiện tại).
   - Application type: Chọn **Web application**.
   - Name: *CourseFree Web Client*.
   - Tại mục **Authorized JavaScript origins**, thêm:
     - `http://localhost:3000` (khi chạy máy tính cá nhân)
     - `https://khoahocfree.online` (khi đưa lên VPS)
     - `https://www.khoahocfree.online`
   - Tại mục **Authorized redirect URIs**, thêm:
     - `http://localhost:3000`
     - `https://khoahocfree.online`
     - `https://www.khoahocfree.online`
   - Bấm **Save / Create**.
5. Bạn sẽ nhận được **Client ID** (chuỗi ký tự kết thúc bằng `.apps.googleusercontent.com`).

### 2. Cập nhật Biến Môi Trường (`.env` & `docker-compose.yml`)
- **Frontend Local** (`Frontend/.env`):
  ```env
  NEXT_PUBLIC_API_URL=http://localhost:5000/api
  BACKEND_URL=http://localhost:5000
  NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxxxxx-xxxxxxxx.apps.googleusercontent.com
  ```
- **Backend Local** (`Backend/.env`):
  ```env
  PORT=5000
  DATABASE_URL="file:./dev.db"
  GOOGLE_CLIENT_ID=xxxxxx-xxxxxxxx.apps.googleusercontent.com
  SESSION_SECRET="chuoi_bi_mat_ngau_nhien"
  FRONTEND_ORIGIN="http://localhost:3000"
  ```
- **Trên VPS Docker** (`docker-compose.yml`):
  Cập nhật `GOOGLE_CLIENT_ID` và `NEXT_PUBLIC_GOOGLE_CLIENT_ID` trong `docker-compose.yml` rồi chạy lại `docker compose up -d --build`.

### 3. Trải nghiệm & Phân quyền Admin
- Người dùng chỉ cần bấm nút **"Đăng nhập với Google"** trên thanh Header hoặc trang Khóa học.
- Nếu email chưa từng có trong Database: Hệ thống **tự động tạo tài khoản học viên mới**, lưu tiến độ bài học và vị trí xem video.
- Nếu đăng nhập bằng email quản trị viên (`maivanhung0604@gmail.com`): Hệ thống tự động cấp quyền **Admin** để truy cập trang Quản trị (`/admin`), thêm/sửa/xóa khóa học, nhập cấu trúc bài học bằng AI JSON và cập nhật link nhóm Zalo/Telegram cộng đồng.
