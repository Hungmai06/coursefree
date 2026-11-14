import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from './lib/prisma';
import { buildHierarchyTree, flattenHierarchy } from './lib/tree';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ADMIN_EMAIL = 'maivanhung0604@gmail.com';
const GOOGLE_CLIENT_ID = (process.env.GOOGLE_CLIENT_ID || '').trim();
const googleAuthClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

// ===== Phiên đăng nhập: token ký HMAC-SHA256 (không phụ thuộc thư viện ngoài) =====
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
if (!process.env.SESSION_SECRET) {
  console.warn('[SECURITY] Chưa đặt SESSION_SECRET trong Backend/.env - phiên đăng nhập sẽ mất khi restart server.');
}
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function signSession(userId: string): string {
  const payload = Buffer.from(JSON.stringify({ uid: userId, exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifySession(token: string): string | null {
  const [payload, sig] = String(token || '').split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (!data.uid || typeof data.exp !== 'number' || data.exp < Date.now()) return null;
    return String(data.uid);
  } catch {
    return null;
  }
}

type AuthedRequest = Request & { authUser?: { id: string; email: string; role: string } };

async function loadAuthUser(req: AuthedRequest) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const uid = verifySession(token);
  if (!uid) return;
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (user) {
    // Quyền admin luôn tính lại từ email, không tin dữ liệu client
    const role = user.email.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';
    req.authUser = { id: user.id, email: user.email, role };
  }
}

// Gắn user (nếu có token hợp lệ) cho mọi request
app.use(async (req: AuthedRequest, _res: Response, next: NextFunction) => {
  try { await loadAuthUser(req); } catch {}
  next();
});

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  next();
}

function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.authUser) return res.status(401).json({ error: 'Vui lòng đăng nhập' });
  if (req.authUser.role !== 'admin') return res.status(403).json({ error: 'Chỉ Admin mới có quyền thực hiện' });
  next();
}

// Giới hạn tần suất đăng nhập đơn giản (chống brute force / spam)
const loginAttempts = new Map<string, { count: number; reset: number }>();
function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (!rec || rec.reset < now) {
    loginAttempts.set(key, { count: 1, reset: now + 60_000 });
    return next();
  }
  rec.count++;
  if (rec.count > 20) return res.status(429).json({ error: 'Thử lại sau ít phút' });
  next();
}

// Header bảo mật
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
});

app.use(cors({
  origin: [FRONTEND_ORIGIN],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '2mb' }));

// Health Check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Google Login: CHỈ chấp nhận ID Token do Google ký, xác thực chữ ký + audience (Client ID)
app.post('/api/auth/google', loginRateLimit, async (req: Request, res: Response) => {
  try {
    const { credential } = req.body || {};
    if (!GOOGLE_CLIENT_ID) {
      return res.status(503).json({ error: 'Server chưa cấu hình GOOGLE_CLIENT_ID' });
    }
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ error: 'Thiếu Google credential' });
    }

    let payload;
    try {
      const ticket = await googleAuthClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'Google token không hợp lệ' });
    }

    if (!payload || !payload.email || payload.email_verified !== true) {
      return res.status(401).json({ error: 'Email Google chưa được xác minh' });
    }

    const email = payload.email.trim().toLowerCase();
    const role = email === ADMIN_EMAIL ? 'admin' : 'user';

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: { email, name: payload.name || email.split('@')[0], image: payload.picture || null, role },
      });
    } else {
      const data: any = {};
      if (user.role !== role) data.role = role;
      if (payload.picture && user.image !== payload.picture) data.image = payload.picture;
      if (payload.name && user.name !== payload.name) data.name = payload.name;
      if (Object.keys(data).length) user = await prisma.user.update({ where: { id: user.id }, data });
    }

    return res.json({
      success: true,
      token: signSession(user.id),
      user: { id: user.id, email: user.email, name: user.name, image: user.image, role },
    });
  } catch (error: any) {
    console.error('Google Auth error:', error);
    return res.status(500).json({ error: 'Đăng nhập Google thất bại' });
  }
});

// GET /api/auth/me - xác thực lại phiên đăng nhập
app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res: Response) => {
  res.json({ user: req.authUser });
});

// Helper đọc/ghi cấu hình nhóm cộng đồng (lưu vào Backend/community-settings.json)
const SETTINGS_FILE = path.resolve(__dirname, '../community-settings.json');

function getCommunitySettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        zaloUrl: typeof parsed.zaloUrl === 'string' ? parsed.zaloUrl : 'https://zalo.me/g/coursefree',
        telegramUrl: typeof parsed.telegramUrl === 'string' ? parsed.telegramUrl : 'https://t.me/coursefree',
        communityTitle: parsed.communityTitle || 'Nhóm Cộng Đồng Share Khóa Học',
      };
    }
  } catch (e) {}
  return {
    zaloUrl: 'https://zalo.me/g/coursefree',
    telegramUrl: 'https://t.me/coursefree',
    communityTitle: 'Nhóm Cộng Đồng Share Khóa Học',
  };
}

// GET /api/config/community
app.get('/api/config/community', (req: Request, res: Response) => {
  return res.json(getCommunitySettings());
});

// PUT /api/config/community (Admin cập nhật link nhóm Zalo & Telegram)
app.put('/api/config/community', requireAdmin, (req: Request, res: Response) => {
  try {
    const { zaloUrl, telegramUrl, communityTitle } = req.body;
    const current = getCommunitySettings();

    const updated = {
      zaloUrl: typeof zaloUrl === 'string' ? zaloUrl.trim() : current.zaloUrl,
      telegramUrl: typeof telegramUrl === 'string' ? telegramUrl.trim() : current.telegramUrl,
      communityTitle:
        typeof communityTitle === 'string' && communityTitle.trim()
          ? communityTitle.trim()
          : current.communityTitle,
    };

    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return res.json({ success: true, ...updated });
  } catch (error: any) {
    console.error('Save community settings error:', error);
    return res.status(500).json({ error: 'Không thể lưu cấu hình cộng đồng' });
  }
});

// GET /api/stats (Thống kê thực tế từ DB: số người đăng ký & số người đang học)
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const [totalUsers, learnersGroup, totalCourses, totalLessons] = await Promise.all([
      prisma.user.count(),
      prisma.lessonProgress.groupBy({ by: ['userId'] }),
      prisma.course.count(),
      prisma.courseNode.count({ where: { type: 'lesson' } }),
    ]);

    const community = getCommunitySettings();

    return res.json({
      totalUsers,
      activeLearners: learnersGroup.length,
      totalCourses,
      totalLessons,
      zaloUrl: community.zaloUrl,
      telegramUrl: community.telegramUrl,
      communityTitle: community.communityTitle,
    });
  } catch (error: any) {
    console.error('Stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Danh sách danh mục chính: Lập trình, Ngoại ngữ, Thiết kế
app.get('/api/categories', async (req: Request, res: Response) => {
  try {
    const courses = await prisma.course.findMany({
      select: { category: true },
    });

    const categoryMap: Record<string, number> = {
      'Tất cả': courses.length,
      'Lập trình': 0,
      'Ngoại ngữ': 0,
      'Thiết kế': 0,
    };

    for (const c of courses) {
      if (categoryMap[c.category] !== undefined) {
        categoryMap[c.category]++;
      } else {
        categoryMap[c.category] = 1;
      }
    }

    const result = Object.entries(categoryMap).map(([name, count]) => ({
      name,
      count,
    }));

    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/courses (Lọc theo Lập trình, Ngoại ngữ... hoặc tìm kiếm)
app.get('/api/courses', async (req: AuthedRequest, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const userId = req.authUser?.id;

    const where: any = {};
    if (category && category !== 'Tất cả' && category !== 'all') {
      where.category = { equals: category };
    }
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { instructor: { contains: search } },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        nodes: {
          select: {
            id: true,
            type: true,
            title: true,
            duration: true,
            position: true,
            progress: {
              where: { userId: userId || '__none__' },
              select: { completed: true, lastPosition: true },
            },
          },
        },
      },
    });

    const formatted = courses.map((course: any) => {
      const chapters = (course.nodes || []).filter((n: any) => n.type === 'chapter');
      const lessons = (course.nodes || []).filter((n: any) => n.type === 'lesson');
      const completed = lessons.filter(
        (l: any) => l.progress && l.progress.length > 0 && l.progress[0].completed
      );

      const firstLesson = lessons[0];
      const progressPercent =
        lessons.length > 0 ? Math.round((completed.length / lessons.length) * 100) : 0;

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        instructor: course.instructor,
        level: course.level,
        duration: course.duration,
        totalChapters: chapters.length,
        totalLessons: lessons.length,
        completedLessons: completed.length,
        progressPercentage: progressPercent,
        firstLessonId: firstLesson?.id || null,
        createdAt: course.createdAt,
      };
    });

    return res.json(formatted);
  } catch (error: any) {
    console.error('Fetch courses error:', error);
    return res.status(500).json({ error: 'Failed to load courses' });
  }
});

// GET /api/user/history?userId=... (Lấy nhật ký học tập gần nhất của học viên)
app.get('/api/user/history', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const userId = req.authUser!.id;

    const recentProgress = await prisma.lessonProgress.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      include: {
        lesson: {
          include: {
            course: true,
          },
        },
      },
    });

    const history = recentProgress.map((p) => ({
      lessonId: p.lessonId,
      lessonTitle: p.lesson.title,
      courseId: p.lesson.courseId,
      courseTitle: p.lesson.course.title,
      courseCategory: p.lesson.course.category,
      completed: p.completed,
      lastPosition: p.lastPosition,
      updatedAt: p.updatedAt,
    }));

    const lastLesson = history.length > 0 ? history[0] : null;

    return res.json({
      history,
      lastLesson,
    });
  } catch (error: any) {
    console.error('Fetch user history error:', error);
    return res.status(500).json({ error: 'Failed to fetch learning history' });
  }
});

// GET /api/courses/:id (Hỗ trợ lọc tiến độ học theo từng User cụ thể)
app.get('/api/courses/:id', async (req: AuthedRequest, res: Response) => {
  try {
    const courseId = String(req.params.id);
    const userId = req.authUser?.id;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        nodes: {
          include: {
            progress: { where: { userId: userId || '__none__' } },
          },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: 'Khóa học không tồn tại' });
    }

    const tree = buildHierarchyTree(course.nodes);
    const lessons = (course.nodes || []).filter((n: any) => n.type === 'lesson');
    const completed = lessons.filter((l: any) => (l.progress || []).some((p: any) => p.completed));

    // Tìm bài học gần nhất mà học viên này đã học trong khóa
    let lastActiveLesson = null;
    if (userId) {
      const recent = await prisma.lessonProgress.findMany({
        where: {
          userId,
          lesson: { courseId },
        },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        include: {
          lesson: true,
        },
      });

      if (recent.length > 0) {
        lastActiveLesson = {
          lessonId: recent[0].lessonId,
          title: recent[0].lesson.title,
          completed: recent[0].completed,
          lastPosition: recent[0].lastPosition,
          updatedAt: recent[0].updatedAt,
        };
      }
    }

    return res.json({
      ...course,
      tree,
      totalChapters: (course.nodes || []).filter((n: any) => n.type === 'chapter').length,
      totalLessons: lessons.length,
      completedLessons: completed.length,
      progressPercentage:
        lessons.length > 0 ? Math.round((completed.length / lessons.length) * 100) : 0,
      lastActiveLesson,
    });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// POST /api/courses (Admin tạo khóa học mới, hỗ trợ nhập cấu trúc JSON từ AI)
app.post('/api/courses', requireAdmin, async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      category,
      thumbnail,
      instructor,
      level,
      duration,
      structureJson,
      tree,
    } = req.body;

    if (!title || !category) {
      return res.status(400).json({ error: 'Tiêu đề và danh mục là bắt buộc' });
    }

    const course = await prisma.course.create({
      data: {
        title,
        description: description || '',
        category,
        thumbnail: thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
        instructor: instructor || 'Giảng viên CourseFree',
        level: level || 'Tất cả trình độ',
        duration: duration || '0h 00m',
      },
    });

    // Xử lý cây cấu trúc từ AI JSON nếu có
    let parsedTree: any[] = [];
    if (Array.isArray(tree) && tree.length > 0) {
      parsedTree = tree;
    } else if (structureJson) {
      try {
        const parsed = typeof structureJson === 'string' ? JSON.parse(structureJson) : structureJson;
        if (Array.isArray(parsed)) {
          parsedTree = parsed;
        } else if (parsed && Array.isArray(parsed.children)) {
          parsedTree = parsed.children;
        }
      } catch (e) {
        console.warn('Lỗi parse JSON cấu trúc khóa học:', e);
      }
    }

    if (parsedTree.length > 0) {
      const flatNodes = flattenHierarchy(parsedTree, course.id);
      for (const node of flatNodes) {
        await prisma.courseNode.create({
          data: {
            id: node.id,
            courseId: node.courseId,
            parentId: node.parentId,
            type: node.type,
            title: node.title,
            url: node.url,
            duration: node.duration,
            position: node.position,
          },
        });
      }
    } else {
      // Tạo sẵn 1 chương mặc định và 1 bài học mẫu nếu không nhập JSON
      const defaultChapter = await prisma.courseNode.create({
        data: {
          courseId: course.id,
          type: 'chapter',
          title: 'Chương 01: Giới thiệu & Bắt đầu',
          position: 1,
        },
      });

      await prisma.courseNode.create({
        data: {
          courseId: course.id,
          parentId: defaultChapter.id,
          type: 'lesson',
          title: 'Bài 1: Tổng quan chương trình học',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          duration: '10:00',
          position: 1,
        },
      });
    }

    return res.status(201).json(course);
  } catch (error: any) {
    console.error('Create course error:', error);
    return res.status(500).json({ error: 'Failed to create course' });
  }
});

// PUT /api/courses/:id (Admin sửa thông tin)
app.put('/api/courses/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = String(req.params.id);
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: req.body,
    });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE /api/courses/:id (Admin xóa khóa học)
app.delete('/api/courses/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = String(req.params.id);
    await prisma.course.delete({
      where: { id: courseId },
    });
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to delete course' });
  }
});

// PUT /api/courses/:id/nodes (Admin cập nhật cây bài học)
app.put('/api/courses/:id/nodes', requireAdmin, async (req: Request, res: Response) => {
  try {
    const courseId = String(req.params.id);
    const { tree } = req.body;

    if (!Array.isArray(tree)) {
      return res.status(400).json({ error: 'Tree array required' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.courseNode.deleteMany({ where: { courseId } });
      const flatNodes = flattenHierarchy(tree, courseId);
      for (const node of flatNodes) {
        await tx.courseNode.create({
          data: {
            id: node.id,
            courseId: node.courseId,
            parentId: node.parentId,
            type: node.type,
            title: node.title,
            url: node.url,
            duration: node.duration,
            position: node.position,
          },
        });
      }
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update tree' });
  }
});

// POST /api/progress (Lưu vị trí video và đánh dấu hoàn thành)
app.post('/api/progress', requireAuth, async (req: AuthedRequest, res: Response) => {
  try {
    const { lessonId, completed, lastPosition } = req.body || {};

    if (!lessonId || typeof lessonId !== 'string') {
      return res.status(400).json({ error: 'lessonId required' });
    }

    const lesson = await prisma.courseNode.findUnique({ where: { id: lessonId }, select: { id: true } });
    if (!lesson) {
      return res.status(404).json({ error: 'Bài học không tồn tại' });
    }

    // userId luôn lấy từ phiên đăng nhập, không tin dữ liệu client gửi lên
    const user = { id: req.authUser!.id };

    // 2. Dữ liệu cập nhật
    const updateData: any = {
      updatedAt: new Date(),
    };
    if (typeof completed === 'boolean') {
      updateData.completed = completed;
      if (completed) updateData.completedAt = new Date();
    }
    if (typeof lastPosition === 'number') {
      updateData.lastPosition = lastPosition;
    }

    // 3. Dùng upsert nguyên tử (Atomic Upsert) để tránh lỗi trùng lặp khi 2 request gửi đồng thời
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: { userId: user.id, lessonId },
      },
      update: updateData,
      create: {
        userId: user.id,
        lessonId,
        completed: completed ?? false,
        lastPosition: lastPosition ?? 0,
        completedAt: completed ? new Date() : null,
        updatedAt: new Date(),
      },
    });

    return res.json(progress);
  } catch (error: any) {
    console.error('Save progress error:', error);
    return res.status(500).json({ error: 'Failed to save progress' });
  }
});

app.listen(PORT, () => {
  console.log(`CourseFree Minimal Backend running at http://localhost:${PORT}`);
});
