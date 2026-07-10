import { type NextRequest, NextResponse } from "next/server"
import { getDB, ensureSchema, newId, isBlockedBetween } from "@/lib/db"

// GET /api/chats?username=me  -> list of chats with last message + unread count
export async function GET(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const username = request.nextUrl.searchParams.get("username")
    if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })

    const memberships = await sql`SELECT chat_id FROM dm_chat_members WHERE username = ${username}`
    const chatIds = memberships.map((m: any) => m.chat_id)
    if (chatIds.length === 0) return NextResponse.json({ chats: [] })

    const chats = await sql`
      SELECT c.id, c.type, c.name, c.created_by, c.created_at,
        (SELECT content FROM dm_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
        (SELECT media_type FROM dm_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_media_type,
        (SELECT created_at FROM dm_messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_time,
        COALESCE((SELECT last_read FROM dm_reads r WHERE r.chat_id = c.id AND r.username = ${username}), 0) AS last_read
      FROM dm_chats c
      WHERE c.id = ANY(${chatIds})
      ORDER BY last_time DESC NULLS LAST
    `

    const withMeta = await Promise.all(
      chats.map(async (c: any) => {
        const members = await sql`SELECT username FROM dm_chat_members WHERE chat_id = ${c.id}`
        const memberNames = members.map((m: any) => m.username)
        const unreadRows = await sql`
          SELECT COUNT(*)::int AS n FROM dm_messages
          WHERE chat_id = ${c.id} AND sender <> ${username} AND created_at > ${c.last_read}
        `
        return {
          id: c.id,
          type: c.type,
          name: c.name,
          members: memberNames,
          otherUser: c.type === "direct" ? memberNames.find((n: string) => n !== username) || "" : null,
          lastMessage: c.last_message,
          lastMediaType: c.last_media_type,
          lastMessageTime: c.last_time ? Number(c.last_time) : Number(c.created_at),
          unreadCount: unreadRows[0]?.n || 0,
        }
      }),
    )

    return NextResponse.json({ chats: withMeta })
  } catch (err) {
    console.error("GET /api/chats error:", err)
    return NextResponse.json({ error: "Failed to load chats" }, { status: 500 })
  }
}

// POST /api/chats  -> create/find a direct chat, or create a group chat
// body: { username, type: 'direct'|'group', otherUser?, members?: string[], name? }
export async function POST(request: NextRequest) {
  try {
    await ensureSchema()
    const sql = getDB()
    const body = await request.json()
    const { username, type = "direct" } = body
    if (!username) return NextResponse.json({ error: "username required" }, { status: 400 })

    if (type === "direct") {
      const otherUser: string = body.otherUser
      if (!otherUser) return NextResponse.json({ error: "otherUser required" }, { status: 400 })
      if (await isBlockedBetween(username, otherUser)) {
        return NextResponse.json({ error: "Unable to start chat" }, { status: 403 })
      }
      // find existing direct chat between exactly these two
      const existing = await sql`
        SELECT c.id FROM dm_chats c
        WHERE c.type = 'direct'
          AND EXISTS (SELECT 1 FROM dm_chat_members m1 WHERE m1.chat_id = c.id AND m1.username = ${username})
          AND EXISTS (SELECT 1 FROM dm_chat_members m2 WHERE m2.chat_id = c.id AND m2.username = ${otherUser})
        LIMIT 1
      `
      if (existing.length > 0) return NextResponse.json({ chatId: existing[0].id })

      const id = newId("chat")
      const now = Date.now()
      await sql`INSERT INTO dm_chats (id, type, created_by, created_at) VALUES (${id}, 'direct', ${username}, ${now})`
      await sql`INSERT INTO dm_chat_members (chat_id, username) VALUES (${id}, ${username}), (${id}, ${otherUser})`
      return NextResponse.json({ chatId: id })
    }

    // group chat
    const members: string[] = Array.from(new Set([...(body.members || []), username]))
    if (members.length < 2) return NextResponse.json({ error: "Need at least 2 members" }, { status: 400 })
    const id = newId("group")
    const now = Date.now()
    await sql`INSERT INTO dm_chats (id, type, name, created_by, created_at) VALUES (${id}, 'group', ${body.name || "Group Chat"}, ${username}, ${now})`
    for (const m of members) {
      await sql`INSERT INTO dm_chat_members (chat_id, username) VALUES (${id}, ${m}) ON CONFLICT DO NOTHING`
    }
    return NextResponse.json({ chatId: id })
  } catch (err) {
    console.error("POST /api/chats error:", err)
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 })
  }
}
