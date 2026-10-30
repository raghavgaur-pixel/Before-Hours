$env:DATABASE_URL = "postgresql://postgres.itqissbbchugrfysjgoo:AfterHours2026%21@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
$env:DIRECT_URL   = "postgresql://postgres.itqissbbchugrfysjgoo:AfterHours2026%21@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
npx prisma db push --schema backend/server/prisma/schema.prisma --accept-data-loss
