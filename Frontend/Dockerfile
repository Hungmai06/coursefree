FROM node:20-alpine

WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm install

# Sao chép mã nguồn Frontend
COPY . .

# Nhận biến môi trường khi build Next.js (Rewrites & Google Client ID)
ARG BACKEND_URL=http://backend:5000
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=335312329426-br7u9qiohc9c8a5aqu7e3k4jlrrbptr6.apps.googleusercontent.com

ENV BACKEND_URL=${BACKEND_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
ENV NODE_ENV=production

# Build ứng dụng Next.js
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
