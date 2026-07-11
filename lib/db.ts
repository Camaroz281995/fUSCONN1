import { neon } from "@neondatabase/serverless"

// Shared database connection for all social features.
// Uses the existing Postgres connection configured in Vercel.
export function getDB() {
  const url =
    process.env.fUSCONN_DATABASE_URL ||
    process.env.fUSCONN_POSTGRES_URL ||
    process.env.fUSCONN_POSTGRES_URL_NON_POOLING

  if (!url) {
    throw new Error("No database URL configured")
  }

  return neon(url)
}
let schemaReady: Promise<void> | null = null

// Lazily create the tables required for messaging, calls, and safety features.
// Runs once per server instance. Uses IF NOT EXISTS so it is safe to call often.
export function ensureSchema(): Promise<void> {
  if (schemaReady) return schemaReady
  const sql = getDB()
  schemaReady = (async () => {
    await sql`CREATE TABLE IF NOT EXISTS dm_chats (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'direct',
      name TEXT,
      created_by TEXT,
      created_at BIGINT NOT NULL
    )`
    await sql`CREATE TABLE IF NOT EXISTS dm_chat_members (
      chat_id TEXT NOT NULL,
      username TEXT NOT NULL,
      PRIMARY KEY (chat_id, username)
    )`
    await sql`CREATE TABLE IF NOT EXISTS dm_messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      content TEXT,
      media_url TEXT,
      media_type TEXT,
      created_at BIGINT NOT NULL
    )`
    await sql`CREATE INDEX IF NOT EXISTS idx_dm_messages_chat ON dm_messages (chat_id, created_at)`
    await sql`CREATE TABLE IF NOT EXISTS dm_reads (
      chat_id TEXT NOT NULL,
      username TEXT NOT NULL,
      last_read BIGINT NOT NULL DEFAULT 0,
      PRIMARY KEY (chat_id, username)
    )`
    await sql`CREATE TABLE IF NOT EXISTS user_blocks (
      blocker TEXT NOT NULL,
      blocked TEXT NOT NULL,
      created_at BIGINT NOT NULL,
      PRIMARY KEY (blocker, blocked)
    )`
    await sql`CREATE TABLE IF NOT EXISTS user_reports (
      id TEXT PRIMARY KEY,
      reporter TEXT NOT NULL,
      reported_user TEXT,
      chat_id TEXT,
      message_id TEXT,
      reason TEXT,
      created_at BIGINT NOT NULL
    )`
    await sql`CREATE TABLE IF NOT EXISTS app_notifications (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      from_user TEXT,
      to_user TEXT NOT NULL,
      content TEXT,
      is_read BOOLEAN NOT NULL DEFAULT false,
      meta JSONB,
      created_at BIGINT NOT NULL
    )`
    await sql`CREATE INDEX IF NOT EXISTS idx_notifications_to ON app_notifications (to_user, created_at)`
    await sql`CREATE TABLE IF NOT EXISTS call_signals (
      id TEXT PRIMARY KEY,
      from_user TEXT NOT NULL,
      to_user TEXT NOT NULL,
      call_id TEXT NOT NULL,
      type TEXT NOT NULL,
      payload TEXT,
      created_at BIGINT NOT NULL
    )`
    await sql`CREATE INDEX IF NOT EXISTS idx_signals_to ON call_signals (to_user, created_at)`
    await sql`CREATE TABLE IF NOT EXISTS call_log (
      id TEXT PRIMARY KEY,
      caller TEXT NOT NULL,
      recipient TEXT NOT NULL,
      call_type TEXT NOT NULL,
      status TEXT NOT NULL,
      duration INTEGER DEFAULT 0,
      created_at BIGINT NOT NULL
    )`
    await sql`CREATE TABLE IF NOT EXISTS user_presence (
      username TEXT PRIMARY KEY,
      last_seen BIGINT NOT NULL
    )`
  })().catch((err) => {
    // reset so a later request can retry
    schemaReady = null
    throw err
  })
  return schemaReady
}

// Returns true if either user has blocked the other.
export async function isBlockedBetween(a: string, b: string): Promise<boolean> {
  const sql = getDB()
  const rows = await sql`
    SELECT 1 FROM user_blocks
    WHERE (blocker = ${a} AND blocked = ${b})
       OR (blocker = ${b} AND blocked = ${a})
    LIMIT 1
  `
  return rows.length > 0
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
