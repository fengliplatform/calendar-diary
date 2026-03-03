import 'dotenv/config'
import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: path.join('prisma', 'schema.prisma'),
  migrations: {
    // Use DIRECT_URL for migrations (bypasses PgBouncer connection pooling)
    connectionString: process.env.DIRECT_URL!,
  },
})
