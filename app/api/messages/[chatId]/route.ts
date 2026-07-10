import { type NextRequest, NextResponse } from "next/server"
import { getDB, ensureSchema, newId, isBlockedBetween } from "@/lib/db"

// GET /api/messages/[chatId]?username=me&since=timestamp -> messages in a chat
export async function GET(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    await ensureSchema()
    const sql = getDB()
    const { chatId } = await params
    const username = request.nextUrl.searchParams.get("username")
    const since = Number(request.nextUrl.searchParams.get("since") || "0")
    if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })

    // verify membership
    const member = await sql`SELECT 1 FROM dm_chat_members WHERE chat_id = ${chatId} AND username = ${username} LIMIT 1`
    if (member.length === 0) return NextResponse.json({ error: "Not a member" }, { status: 403 })

    const messages = await sql`
      SELECT id, chat_id, sender, content, media_url, media_type, created_at
      FROM dm_messages
      WHERE chat_id = ${chatId} AND created_at > ${since}
      ORDER BY created_at ASC
      LIMIT 200
    `
    // mark read up to newest
    const now = Date.now()
    await sql`
      INSERT INTO dm_reads (chat_id, username, last_read) VALUES (${chatId}, ${username}, ${now})
      ON CONFLICT (chat_id, username) DO UPDATE SET last_read = ${now}
    `
    return NextResponse.json({
      messages: messages.map((m: any) => ({ ...m, created_at: Number(m.created_at) })),
    })
  } catch (err) {
    console.error("GET /api/messages/[chatId] error:", err)
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 })
  }
}

// POST /api/messages/[chatId] -> send a message (text and/or media)
// body: { sender, content?, mediaUrl?, mediaType? }
export async function POST(request: NextRequest, { params }: { params: Promise<{ chatId: string }> }) {
  try {
    await ensureSchema()
    const sql = getDB()
    const { chatId } = await params
    const { sender, content, mediaUrl, mediaType } = await request.json()
    if (!sender) return NextResponse.json({ error: "sender required" }, { status: 400 })
    if (!content?.trim() && !mediaUrl) {
      return NextResponse.json({ error: "Message is empty" }, { status: 400 })
    }

    const members = await sql`SELECT username FROM dm_chat_members WHERE chat_id = ${chatId}`
    const memberNames = members.map((m: any) => m.username)
    if (!memberNames.includes(sender)) return NextResponse.json({ error: "Not a member" }, { status: 403 })

    // block check for direct chats
    const others = memberNames.filter((n: string) => n !== sender)
    for (const other of others) {
      if (await isBlockedBetween(sender, other)) {
        return NextResponse.json({ error: "You cannot message this user" }, { status: 403 })
      }
    }

    const id = newId("msg")
    const now = Date.now()
    await sql`
      INSERT INTO dm_messages (id, chat_id, sender, content, media_url, media_type, created_at)
      VALUES (${id}, ${chatId}, ${sender}, ${content?.trim() || null}, ${mediaUrl || null}, ${mediaType || null}, ${now})
    `
    // notify other members
    for (const other of others) {
      const nId = newId("notif")
      const preview = mediaUrl ? `sent a ${mediaType || "file"}` : (content || "").slice(0, 80)
      await sql`
        INSERT INTO app_notifications (id, type, from_user, to_user, content, is_read, meta, created_at)
        VALUES (${nId}, 'message', ${sender}, ${other}, ${`${sender}: ${preview}`}, false, ${JSON.stringify({ chatId })}, ${now})
      `
    }
    return NextResponse.json({ success: true, id, created_at: now }, { status: 201 })
  } catch (err) {
    console.error("POST /api/messages/[chatId] error:", err)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
