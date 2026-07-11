import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, CertType, TierName } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { mockUsers } from './mockUsers';
import { ulid } from 'ulid';
import { deriveCertificateNumber } from '../src/utils';
import { attachMetrics } from '../../shared/pricing';

import * as bcrypt from 'bcrypt';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to run the seed script.');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function sampleSize<T>(arr: T[], size: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, size);
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

async function main() {
  console.log('Cleaning database...');
  try {
    await prisma.userCertificate.deleteMany();
    await prisma.question.deleteMany();
    await prisma.testVariant.deleteMany();
    await prisma.test.deleteMany();
    await prisma.user.deleteMany();
  } catch (e) {
    console.log('Note: database cleanup skipped (tables may not exist yet).');
  }

  console.log('Seeding database with mock data...');
  const hashedPassword = await bcrypt.hash('2', 10);
  const users = await Promise.all(
    mockUsers.map((u) =>
      prisma.user.create({
        data: { ...u, id: ulid(), password: hashedPassword },
      }),
    ),
  );

  // 3. Create tests, variants, and questions in Arabic
  const testsDir = path.join(__dirname, 'seeding');
  const certDirs = fs.readdirSync(testsDir).filter((name) => {
    return fs.statSync(path.join(testsDir, name)).isDirectory();
  });

  const mockTests: any[] = [];
  for (const certDir of certDirs) {
    const certPath = path.join(testsDir, certDir);
    const files = fs
      .readdirSync(certPath)
      .filter((file) => file.endsWith('.json'));
    for (const file of files) {
      const filePath = path.join(certPath, file);
      mockTests.push(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
    }
  }

  const allVariants: Array<any> = [];

  for (const tDef of mockTests) {
    const test = await prisma.test.create({
      data: {
        id: ulid(),
        cert: tDef.cert as CertType,
        desc: tDef.desc,
        arabicTitle: tDef.arabicTitle,
        englishTitle: tDef.englishTitle,
      },
    });

    // Seed 3 variants for each test: Silver, Gold, Platinum
    const variantsData = [
      {
        id: ulid(),
        testId: test.id,
        tierName: TierName.SMALL,
      },
      {
        id: ulid(),
        testId: test.id,
        tierName: TierName.MEDIUM,
      },
      {
        id: ulid(),
        testId: test.id,
        tierName: TierName.LARGE,
      },
    ];

    const variants = await Promise.all(
      variantsData.map((v) => prisma.testVariant.create({ data: v })),
    );
    allVariants.push(...variants);

    // Seed 30 questions for this test to support the LARGE variant's questionCount limit
    const targetQuestionPoolSize = 30;
    const questionsToCreate: typeof tDef.questions = [];
    for (let i = 0; i < targetQuestionPoolSize; i++) {
      const baseQ = tDef.questions[i % tDef.questions.length];
      questionsToCreate.push({
        text:
          i >= tDef.questions.length
            ? `${baseQ.text} (مستوى متقدم - ${Math.floor(i / 15) + 1})`
            : baseQ.text,
        options: baseQ.options,
      });
    }

    const questionPromises = questionsToCreate.map((q) =>
      prisma.question.create({
        data: {
          id: ulid(),
          text: q.text,
          options: q.options,
          testId: test.id,
        },
      }),
    );
    await Promise.all(questionPromises);
  }

  console.log(
    `Database seeded successfully! (${users.length} users, ${mockTests.length} tests, ${allVariants.length} variants, 0 certificates)`,
  );
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
