const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  if (process.argv.includes('--if-empty')) {
    const existingCourses = await prisma.course.count();
    if (existingCourses > 0) {
      console.log(`Database already has ${existingCourses} courses. Skipping seed.`);
      return;
    }
  }

  console.log('Clearing old data...');
  await prisma.lessonProgress.deleteMany();
  await prisma.courseNode.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users (Admin & Student)...');
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@coursefree.com',
      name: 'Quản Trị Viên (Admin)',
      image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
      role: 'admin',
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      email: 'hocvien@gmail.com',
      name: 'Nguyễn Văn Học Viên',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
      role: 'user',
    },
  });

  console.log('Seeding Courses in LẬP TRÌNH, NGOẠI NGỮ, THIẾT KẾ...');

  // --- 1. LẬP TRÌNH: Web Full-Stack ---
  const c1 = await prisma.course.create({
    data: {
      title: 'Lập Trình Web Full-Stack từ Cơ Bản đến Chuyên Nghiệp',
      description: 'Lộ trình tối giản, thực tế: làm chủ HTML, CSS, JavaScript, React và Node.js Express để tự xây dựng ứng dụng web hoàn chỉnh.',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      category: 'Lập trình',
      instructor: 'Trần Minh Quang',
      level: 'Cơ bản - Nâng cao',
      duration: '18h 30m',
    },
  });

  const c1_ch1 = await prisma.courseNode.create({
    data: {
      courseId: c1.id,
      type: 'chapter',
      title: 'Chương 01: Nền tảng HTML, CSS & Responsive Design',
      position: 1,
    },
  });
  const c1_l1 = await prisma.courseNode.create({
    data: {
      courseId: c1.id,
      parentId: c1_ch1.id,
      type: 'lesson',
      title: 'Bài 1: Cấu trúc trang Web và Semantic Tags chuẩn SEO',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: '14:20',
      position: 1,
    },
  });
  const c1_l2 = await prisma.courseNode.create({
    data: {
      courseId: c1.id,
      parentId: c1_ch1.id,
      type: 'lesson',
      title: 'Bài 2: Flexbox, CSS Grid và xây dựng Layout hiện đại',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      duration: '20:15',
      position: 2,
    },
  });

  const c1_ch2 = await prisma.courseNode.create({
    data: {
      courseId: c1.id,
      type: 'chapter',
      title: 'Chương 02: JavaScript ES6+ & Lập trình Hướng đối tượng',
      position: 2,
    },
  });
  const c1_l3 = await prisma.courseNode.create({
    data: {
      courseId: c1.id,
      parentId: c1_ch2.id,
      type: 'lesson',
      title: 'Bài 3: DOM, Event Handling và Bất đồng bộ (Async/Await)',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: '22:40',
      position: 1,
    },
  });
  const c1_l4 = await prisma.courseNode.create({
    data: {
      courseId: c1.id,
      parentId: c1_ch2.id,
      type: 'lesson',
      title: 'Bài 4: Fetch API, RESTful Backend và Xử lý dữ liệu',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      duration: '18:50',
      position: 2,
    },
  });

  // --- 2. LẬP TRÌNH: Python ---
  const c2 = await prisma.course.create({
    data: {
      title: 'Lập Trình Python Cơ Bản & Ứng Dụng Tự Động Hóa',
      description: 'Học cú pháp Python dễ hiểu, xử lý file, tự động hóa tác vụ văn phòng và phân tích dữ liệu với Pandas.',
      thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      category: 'Lập trình',
      instructor: 'Lê Hoàng Nam',
      level: 'Người mới bắt đầu',
      duration: '12h 45m',
    },
  });

  const c2_ch1 = await prisma.courseNode.create({
    data: {
      courseId: c2.id,
      type: 'chapter',
      title: 'Chương 01: Cài đặt và Làm quen với cú pháp Python',
      position: 1,
    },
  });
  await prisma.courseNode.create({
    data: {
      courseId: c2.id,
      parentId: c2_ch1.id,
      type: 'lesson',
      title: 'Bài 1: Cài đặt môi trường VS Code & Biến, Kiểu dữ liệu',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      duration: '15:10',
      position: 1,
    },
  });
  await prisma.courseNode.create({
    data: {
      courseId: c2.id,
      parentId: c2_ch1.id,
      type: 'lesson',
      title: 'Bài 2: Vòng lặp For, While và Câu lệnh điều kiện If/Else',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
      duration: '17:30',
      position: 2,
    },
  });

  // --- 3. NGOẠI NGỮ: Tiếng Anh Giao Tiếp ---
  const c3 = await prisma.course.create({
    data: {
      title: 'Tiếng Anh Giao Tiếp Thực Chiến Cho Người Đi Làm',
      description: 'Phương pháp phản xạ nhanh, chuẩn phát âm IPA, từ vựng theo chủ đề văn phòng, viết email và thuyết trình quốc tế.',
      thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?auto=format&fit=crop&w=1200&q=80',
      category: 'Ngoại ngữ',
      instructor: 'Ms. Sarah Nguyễn',
      level: 'Mọi trình độ',
      duration: '15h 20m',
    },
  });

  const c3_ch1 = await prisma.courseNode.create({
    data: {
      courseId: c3.id,
      type: 'chapter',
      title: 'Chương 01: Chuẩn hóa Phát âm IPA & Trọng âm',
      position: 1,
    },
  });
  const c3_l1 = await prisma.courseNode.create({
    data: {
      courseId: c3.id,
      parentId: c3_ch1.id,
      type: 'lesson',
      title: 'Bài 1: 44 âm IPA và kỹ thuật đặt khẩu hình miệng',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      duration: '16:05',
      position: 1,
    },
  });
  await prisma.courseNode.create({
    data: {
      courseId: c3.id,
      parentId: c3_ch1.id,
      type: 'lesson',
      title: 'Bài 2: Quy tắc nối âm (Linking sounds) và ngữ điệu tự nhiên',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
      duration: '19:40',
      position: 2,
    },
  });

  const c3_ch2 = await prisma.courseNode.create({
    data: {
      courseId: c3.id,
      type: 'chapter',
      title: 'Chương 02: Giao tiếp Văn phòng & Gặp gỡ Khách hàng',
      position: 2,
    },
  });
  await prisma.courseNode.create({
    data: {
      courseId: c3.id,
      parentId: c3_ch2.id,
      type: 'lesson',
      title: 'Bài 3: Chào hỏi, giới thiệu bản thân và công việc trong công ty',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      duration: '18:25',
      position: 1,
    },
  });

  // --- 4. NGOẠI NGỮ: Tiếng Nhật N5 - N4 ---
  const c4 = await prisma.course.create({
    data: {
      title: 'Khóa Học Tiếng Nhật N5 - N4 Cho Người Mới Bắt Đầu',
      description: 'Làm quen bảng chữ cái Hiragana, Katakana, Kanji thông dụng và các mẫu ngữ pháp cơ bản để giao tiếp hàng ngày.',
      thumbnail: 'https://images.unsplash.com/photo-1528164344705-475426879c0d?auto=format&fit=crop&w=1200&q=80',
      category: 'Ngoại ngữ',
      instructor: 'Sensei Tanaka / Minh Thu',
      level: 'Cơ bản (N5-N4)',
      duration: '24h 00m',
    },
  });

  const c4_ch1 = await prisma.courseNode.create({
    data: {
      courseId: c4.id,
      type: 'chapter',
      title: 'Chương 01: Bảng chữ cái Hiragana & Katakana',
      position: 1,
    },
  });
  await prisma.courseNode.create({
    data: {
      courseId: c4.id,
      parentId: c4_ch1.id,
      type: 'lesson',
      title: 'Bài 1: Hướng dẫn viết bảng chữ Hiragana và quy tắc biến âm',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      duration: '21:10',
      position: 1,
    },
  });
  await prisma.courseNode.create({
    data: {
      courseId: c4.id,
      parentId: c4_ch1.id,
      type: 'lesson',
      title: 'Bài 2: Bảng chữ Katakana và từ vựng vay mượn tiếng Anh',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      duration: '18:30',
      position: 2,
    },
  });

  // --- 5. NGOẠI NGỮ: Tiếng Trung HSK ---
  const c5 = await prisma.course.create({
    data: {
      title: 'Tiếng Trung Giao Tiếp Căn Bản HSK 1 - HSK 3',
      description: 'Học phát âm Pinyin chuẩn Bắc Kinh, các nét chữ Hán cơ bản và giao tiếp lưu loát các tình huống đời sống.',
      thumbnail: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1200&q=80',
      category: 'Ngoại ngữ',
      instructor: 'Cô Trương Lệ Hoa',
      level: 'Cơ bản (HSK 1-3)',
      duration: '20h 10m',
    },
  });

  const c5_ch1 = await prisma.courseNode.create({
    data: {
      courseId: c5.id,
      type: 'chapter',
      title: 'Chương 01: Ngữ âm Pinyin & 4 Thanh điệu',
      position: 1,
    },
  });
  await prisma.courseNode.create({
    data: {
      courseId: c5.id,
      parentId: c5_ch1.id,
      type: 'lesson',
      title: 'Bài 1: Bảng thanh mẫu, vận mẫu và cách ghép âm Pinyin',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      duration: '20:00',
      position: 1,
    },
  });

  // --- 6. THIẾT KẾ: UI/UX Figma ---
  const c6 = await prisma.course.create({
    data: {
      title: 'Thiết Kế UI/UX Chuyên Nghiệp với Figma',
      description: 'Làm chủ Design System, Auto-layout, Component variant, Typography và tạo Prototype tương tác sống động.',
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      category: 'Thiết kế',
      instructor: 'Nguyễn Đăng Khoa',
      level: 'Tất cả trình độ',
      duration: '10h 30m',
    },
  });

  const c6_ch1 = await prisma.courseNode.create({
    data: {
      courseId: c6.id,
      type: 'chapter',
      title: 'Chương 01: Công cụ Figma & Design System',
      position: 1,
    },
  });
  await prisma.courseNode.create({
    data: {
      courseId: c6.id,
      parentId: c6_ch1.id,
      type: 'lesson',
      title: 'Bài 1: Auto-Layout 5.0 và tư duy Responsive Components',
      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
      duration: '16:45',
      position: 1,
    },
  });

  // Gán tiến độ mẫu cho admin
  await prisma.lessonProgress.create({
    data: {
      userId: adminUser.id,
      lessonId: c1_l1.id,
      completed: true,
      lastPosition: 860,
      completedAt: new Date(),
    },
  });
  await prisma.lessonProgress.create({
    data: {
      userId: adminUser.id,
      lessonId: c1_l2.id,
      completed: false,
      lastPosition: 320,
    },
  });
  await prisma.lessonProgress.create({
    data: {
      userId: adminUser.id,
      lessonId: c3_l1.id,
      completed: true,
      lastPosition: 965,
      completedAt: new Date(),
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
