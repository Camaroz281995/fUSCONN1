import { type NextRequest, NextResponse } from "next/server"
import { getDB, ensureSchema, newId } from "@/lib/db"

// GET /api/calls/history?username=me -> call history involving the user
export async function GET(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const username = request.nextUrl.searchParams.get("username")
    if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })
    const rows = await sql`
      SELECT id, caller, recipient, call_type, status, duration, created_at
      FROM call_log
      WHERE caller = ${username} OR recipient = ${username}
      ORDER BY created_at DESC
      LIMIT 100
    `
    return NextResponse.json({
      calls: rows.map((r: any) => {
        const startTime = Number(r.created_at)
        const duration = Number(r.duration) || 0
        return {
          id: r.id,
          callerId: r.caller,
          recipientId: r.recipient,
          type: r.call_type,
          status: r.status,
          startTime,
          endTime: startTime + duration * 1000,
        }
      }),
    })
  } catch (err) {
    console.error("GET /api/calls/history error:", err)
    return NextResponse.json({ error: "Failed to load call history" }, { status: 500 })
  }
}

// POST /api/calls/history  body: { caller, recipient, callType, status, duration }
export async function POST(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const { caller, recipient, callType, status, duration } = await request.json()
    if (!caller || !recipient) return NextResponse.json({ error: "caller and recipient required" }, { status: 400 })
    const id = newId("call")
    await sql`
      INSERT INTO call_log (id, caller, recipient, call_type, status, duration, created_at)
      VALUES (${id}, ${caller}, ${recipient}, ${callType || "voice"}, ${status || "ended"}, ${duration || 0}, ${Date.now()})
    `
    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (err) {
    console.error("POST /api/calls/history error:", err)
    return NextResponse.json({ error: "Failed to log call" }, { status: 500 })
  }
}
