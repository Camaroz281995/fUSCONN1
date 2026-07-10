import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function getDB() {
  const url = process.env.fusconn_DATABASE_URL_UNPOOLED || process.env.fusconn_DATABASE_URL || process.env.fusconn_POSTGRES_URL
  if (!url) throw new Error("No database URL configured")
  return neon(url)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ postId: string }> }) {
  try {
    const sql = getDB()
    const { username, content } = await request.json()
    const { postId } = await params
    if (!username || !content?.trim()) {
      return NextResponse.json({ error: "Username and content are required" }, { status: 400 })
    }
    const id = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const createdAt = Date.now()
    await sql`
      INSERT INTO comments (id, username, post_id, content, created_at)
      VALUES (${id}, ${username}, ${postId}, ${content.trim()}, ${createdAt})
    `
    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (err) {
    console.error("POST /api/posts/[postId]/comments error:", err)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
