const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: [] });

async function main() {
  await prisma.lessonProgress.deleteMany();
  await prisma.courseNode.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
