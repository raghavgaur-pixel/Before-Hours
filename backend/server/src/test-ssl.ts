import { PrismaClient } from "@prisma/client";

async function testWithUrl(url: string, label: string) {
  console.log(`Testing [${label}]...`);
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const res = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log(`>>> SUCCESS [${label}]! <<<`, res);
    await prisma.$disconnect();
    return true;
  } catch (e: any) {
    console.log(`Failed [${label}]:`, e.message?.slice(0, 150));
    await prisma.$disconnect();
    return false;
  }
}

async function run() {
  const pw = "xPahL02XMo6Omdwa";
  const tenant = "postgres.itqissbbchugrfysjgoo";
  const host = "aws-0-eu-north-1.pooler.supabase.com";

  await testWithUrl(`postgresql://${tenant}:${pw}@${host}:5432/postgres?sslmode=require`, "5432 sslmode=require");
  await testWithUrl(`postgresql://${tenant}:${pw}@${host}:6543/postgres?pgbouncer=true&sslmode=require`, "6543 pgbouncer & ssl");
  await testWithUrl(`postgresql://${tenant}:${pw}@${host}:5432/postgres?schema=public`, "5432 schema=public");
}

run();

