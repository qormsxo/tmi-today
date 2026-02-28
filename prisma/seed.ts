import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required for seeding');
}

const adapter = new PrismaMariaDb(databaseUrl);
const prisma = new PrismaClient({ adapter });

const categories = [
  { code: 'food', name: '음식' },
  { code: 'history', name: '역사' },
  { code: 'animal', name: '동물' },
  { code: 'body', name: '신체' },
  { code: 'science', name: '과학' },
  { code: 'daily', name: '일상' },
];

async function main() {
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { code: cat.code },
      update: { name: cat.name },
      create: cat,
    });
  }
  console.log('✅ Categories seeded:', categories.map((c) => c.code).join(', '));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
