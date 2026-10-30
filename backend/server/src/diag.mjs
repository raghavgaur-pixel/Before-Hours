import { PrismaClient } from "@prisma/client";

const url = "postgresql://postgres.itqissbbchugrfysjgoo:xPahL02XMo6Omdwa@aws-0-eu-north-1.pooler.supabase.com:5432/postgres?sslmode=require";
const p = new PrismaClient({ datasources: { db: { url } } });

try {
  const res = await p.$queryRawUnsafe("SELECT 1 as num");
  console.log("SUCCESS:", res);
} catch (e) {
  console.log("FULL ERROR CODE:", e.code);
  console.log("FULL ERROR MESSAGE:", e.message);
} finally {
  await p.$disconnect();
}

