import { type NextRequest, NextResponse } from "next/server"
import { getDB, ensureSchema, newId } from "@/lib/db"

// GET /api/notifications?username=me -> notifications for a user
export async function GET(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const username = request.nextUrl.searchParams.get("username")
    if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })
    const rows = await sql`
      SELECT id, type, from_user, to_user, content, is_read, meta, created_at
      FROM app_notifications
      WHERE to_user = ${username}
      ORDER BY created_at DESC
      LIMIT 100
    `
    return NextResponse.json({
      notifications: rows.map((r: any) => ({ ...r, created_at: Number(r.created_at) })),
    })
  } catch (err) {
    console.error("GET /api/notifications error:", err)
    return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
  }
}

// POST /api/notifications  body: { type, fromUser, toUser, content, meta? }
export async function POST(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const { type, fromUser, toUser, content, meta } = await request.json()
    if (!type || !toUser) return NextResponse.json({ error: "type and toUser required" }, { status: 400 })
    const id = newId("notif")
    await sql`
      INSERT INTO app_notifications (id, type, from_user, to_user, content, is_read, meta, created_at)
      VALUES (${id}, ${type}, ${fromUser || null}, ${toUser}, ${content || null}, false, ${meta ? JSON.stringify(meta) : null}, ${Date.now()})
    `
    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (err) {
    console.error("POST /api/notifications error:", err)
    return NextResponse.json({ error: "Failed to create notification" }, { status: 500 })
  }
}

// PATCH /api/notifications  body: { username, id? }  -> mark one or all read
export async function PATCH(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const { username, id } = await request.json()
    if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })
    if (id) {
      await sql`UPDATE app_notifications SET is_read = true WHERE id = ${id} AND to_user = ${username}`
    } else {
      await sql`UPDATE app_notifications SET is_read = true WHERE to_user = ${username}`
    }
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("PATCH /api/notifications error:", err)
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}
