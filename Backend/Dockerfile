FROM node:20-alpine

# Cài đặt openssl cho Prisma Engine
RUN apk add --no-cache openssl

WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép mã nguồn và dùng schema MySQL cho Docker
COPY . .
RUN cp prisma/schema.mysql.prisma prisma/schema.prisma

# Generate Prisma Client và build TypeScript
ENV DATABASE_URL="mysql://root:root_secure_password_123@db:3306/coursefree"
RUN npx prisma generate && npm run build

# Thư mục lưu cấu hình cộng đồng bền vững
RUN mkdir -p /app/data

EXPOSE 5000

# Tự động đồng bộ schema MySQL và khởi chạy server
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/server.js"]
