import { type NextRequest, NextResponse } from "next/server"
import { getDB, ensureSchema, newId, isBlockedBetween } from "@/lib/db"

// GET /api/calls/signal?username=me&since=ts -> pending WebRTC signals addressed to me
export async function GET(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const username = request.nextUrl.searchParams.get("username")
    const since = Number(request.nextUrl.searchParams.get("since") || "0")
    if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })
    const rows = await sql`
      SELECT id, from_user, to_user, call_id, type, payload, created_at
      FROM call_signals
      WHERE to_user = ${username} AND created_at > ${since}
      ORDER BY created_at ASC
      LIMIT 100
    `
    return NextResponse.json({
      signals: rows.map((r: any) => ({ ...r, created_at: Number(r.created_at) })),
    })
  } catch (err) {
    console.error("GET /api/calls/signal error:", err)
    return NextResponse.json({ error: "Failed to load signals" }, { status: 500 })
  }
}

// POST /api/calls/signal
// body: { fromUser, toUser, callId, type: 'offer'|'answer'|'ice'|'ringing'|'reject'|'end', payload? }
export async function POST(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const { fromUser, toUser, callId, type, payload } = await request.json()
    if (!fromUser || !toUser || !callId || !type) {
      return NextResponse.json({ error: "fromUser, toUser, callId, type required" }, { status: 400 })
    }
    if (type === "offer" && (await isBlockedBetween(fromUser, toUser))) {
      return NextResponse.json({ error: "Cannot call this user" }, { status: 403 })
    }
    const id = newId("sig")
    const now = Date.now()
    await sql`
      INSERT INTO call_signals (id, from_user, to_user, call_id, type, payload, created_at)
      VALUES (${id}, ${fromUser}, ${toUser}, ${callId}, ${type}, ${payload ? JSON.stringify(payload) : null}, ${now})
    `
    if (type === "offer") {
      const nId = newId("notif")
      await sql`
        INSERT INTO app_notifications (id, type, from_user, to_user, content, is_read, meta, created_at)
        VALUES (${nId}, 'call', ${fromUser}, ${toUser}, ${`${fromUser} is calling you`}, false, ${JSON.stringify({ callId })}, ${now})
      `
    }
    return NextResponse.json({ success: true, id, created_at: now }, { status: 201 })
  } catch (err) {
    console.error("POST /api/calls/signal error:", err)
    return NextResponse.json({ error: "Failed to send signal" }, { status: 500 })
  }
}
