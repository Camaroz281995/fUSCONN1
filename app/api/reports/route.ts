import { type NextRequest, NextResponse } from "next/server"
import { getDB, ensureSchema, newId } from "@/lib/db"

// POST /api/reports  body: { reporter, reportedUser?, chatId?, messageId?, reason }
export async function POST(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const { reporter, reportedUser, chatId, messageId, reason } = await request.json()
    if (!reporter || !reason?.trim()) {
      return NextResponse.json({ error: "reporter and reason required" }, { status: 400 })
    }
    const id = newId("report")
    await sql`
      INSERT INTO user_reports (id, reporter, reported_user, chat_id, message_id, reason, created_at)
      VALUES (${id}, ${reporter}, ${reportedUser || null}, ${chatId || null}, ${messageId || null}, ${reason.trim()}, ${Date.now()})
    `
    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (err) {
    console.error("POST /api/reports error:", err)
    return NextResponse.json({ error: "Failed to submit report" }, { status: 500 })
  }
}
