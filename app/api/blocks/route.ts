import { type NextRequest, NextResponse } from "next/server"
import { getDB, ensureSchema } from "@/lib/db"

// GET /api/blocks?username=me -> list of usernames I have blocked
export async function GET(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const username = request.nextUrl.searchParams.get("username")
    if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })
    const rows = await sql`SELECT blocked FROM user_blocks WHERE blocker = ${username} ORDER BY created_at DESC`
    return NextResponse.json({ blocked: rows.map((r: any) => r.blocked) })
  } catch (err) {
    console.error("GET /api/blocks error:", err)
    return NextResponse.json({ error: "Failed to load blocks" }, { status: 500 })
  }
}

// POST /api/blocks  body: { username, target } -> block a user
export async function POST(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const { username, target } = await request.json()
    if (!username || !target) return NextResponse.json({ error: "username and target required" }, { status: 400 })
    await sql`
      INSERT INTO user_blocks (blocker, blocked, created_at) VALUES (${username}, ${target}, ${Date.now()})
      ON CONFLICT (blocker, blocked) DO NOTHING
    `
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("POST /api/blocks error:", err)
    return NextResponse.json({ error: "Failed to block user" }, { status: 500 })
  }
}

// DELETE /api/blocks?username=me&target=them -> unblock
export async function DELETE(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const username = request.nextUrl.searchParams.get("username")
    const target = request.nextUrl.searchParams.get("target")
    if (!username || !target) return NextResponse.json({ error: "username and target required" }, { status: 400 })
    await sql`DELETE FROM user_blocks WHERE blocker = ${username} AND blocked = ${target}`
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("DELETE /api/blocks error:", err)
    return NextResponse.json({ error: "Failed to unblock user" }, { status: 500 })
  }
}
