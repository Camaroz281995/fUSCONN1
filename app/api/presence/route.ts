import { NextResponse } from "next/server"
import { getDB, ensureSchema } from "@/lib/db"

// A user is considered "online" if we've seen a heartbeat in the last 30s.
const ONLINE_WINDOW = 30_000

export async function POST(request: Request) {
  try {
    await ensureSchema()
    const { username } = await request.json()
    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 })
    }
    const sql = getDB()
    const now = Date.now()

    await sql`
      INSERT INTO user_presence (username, last_seen)
      VALUES (${username}, ${now})
      ON CONFLICT (username) DO UPDATE SET last_seen = ${now}
    `

    const rows = await sql`
      SELECT username FROM user_presence
      WHERE last_seen > ${now - ONLINE_WINDOW}
    `
    return NextResponse.json({ online: rows.map((r: any) => r.username as string) })
  } catch (err) {
    console.error("[v0] presence error:", err)
    return NextResponse.json({ error: "presence failed" }, { status: 500 })
  }
}
