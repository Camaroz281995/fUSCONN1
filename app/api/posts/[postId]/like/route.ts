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
    const { username } = await request.json()
    const { postId } = await params
    if (!username) return NextResponse.json({ error: "Username required" }, { status: 400 })

    const existing = await sql`SELECT 1 FROM post_likes WHERE post_id = ${postId} AND username = ${username}`
    if (existing.length > 0) {
      await sql`DELETE FROM post_likes WHERE post_id = ${postId} AND username = ${username}`
      return NextResponse.json({ liked: false })
    } else {
      await sql`INSERT INTO post_likes (post_id, username) VALUES (${postId}, ${username})`
      return NextResponse.json({ liked: true })
    }
  } catch (err) {
    console.error("POST like error:", err)
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 })
  }
}
